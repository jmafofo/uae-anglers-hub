-- ============================================================
-- UAE Anglers Hub — Catch comments
--
-- Adds discussion threads to individual catches. Mirrors the
-- forum_replies conventions (edit, soft-delete, throttle,
-- notifications, @mention) so admins/users see one consistent
-- model across both surfaces.
--
-- Extends moderation_reports and notifications to know about
-- this new target type so existing infra (Report button,
-- moderation dashboard, NotificationsDropdown) keeps working
-- without per-surface code.
-- ============================================================

-- ── 1. Comments table ──────────────────────────────────────
create table if not exists public.catch_comments (
  id              uuid primary key default gen_random_uuid(),
  catch_id        uuid not null references public.catches(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz,
  deleted_by      uuid references public.profiles(id),
  deleted_reason  text,
  constraint catch_comments_body_length check (char_length(body) between 1 and 2000)
);

create index if not exists catch_comments_catch_ix    on public.catch_comments (catch_id, created_at);
create index if not exists catch_comments_user_ix     on public.catch_comments (user_id, created_at desc);
create index if not exists catch_comments_deleted_ix  on public.catch_comments (deleted_at) where deleted_at is not null;

alter table public.catch_comments enable row level security;

-- Catch comments inherit the catch's visibility — if the catch
-- itself is publicly visible to the viewer (RLS on catches),
-- so are its comments. Auth users can write.
drop policy if exists "Catch comments viewable by all" on public.catch_comments;
create policy "Catch comments viewable by all"
  on public.catch_comments for select using (true);

drop policy if exists "Auth users can comment on catches" on public.catch_comments;
create policy "Auth users can comment on catches"
  on public.catch_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own catch comments" on public.catch_comments;
create policy "Users can update own catch comments"
  on public.catch_comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own catch comments" on public.catch_comments;
create policy "Users can delete own catch comments"
  on public.catch_comments for delete
  using (auth.uid() = user_id);


-- ── 2. edited_at trigger ───────────────────────────────────
-- Reuses public.touch_edited_at from add_forum_ugc_moderation_and_quotas.sql.
-- That function inspects tg_table_name; add a branch for catch_comments.
create or replace function public.touch_edited_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_table_name = 'forum_threads' then
    if new.title is distinct from old.title
       or new.body is distinct from old.body
       or new.tags is distinct from old.tags then
      new.edited_at := now();
    end if;
  elsif tg_table_name = 'forum_replies' then
    if new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  elsif tg_table_name = 'catch_comments' then
    if new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists catch_comments_touch_edited_at on public.catch_comments;
create trigger catch_comments_touch_edited_at
  before update on public.catch_comments
  for each row execute procedure public.touch_edited_at();


-- ── 3. comment_count on catches ────────────────────────────
alter table public.catches
  add column if not exists comment_count int not null default 0;

create or replace function public.catch_comment_count_recount()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cid uuid;
  c   int;
begin
  if tg_op = 'DELETE' then cid := old.catch_id; else cid := new.catch_id; end if;
  select count(*) into c
  from public.catch_comments
  where catch_id = cid and deleted_at is null;
  update public.catches set comment_count = c where id = cid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists catch_comments_count_ins on public.catch_comments;
create trigger catch_comments_count_ins
  after insert on public.catch_comments
  for each row execute procedure public.catch_comment_count_recount();

-- Soft-delete sets deleted_at; recount on update to that column.
drop trigger if exists catch_comments_count_upd on public.catch_comments;
create trigger catch_comments_count_upd
  after update of deleted_at on public.catch_comments
  for each row execute procedure public.catch_comment_count_recount();

drop trigger if exists catch_comments_count_del on public.catch_comments;
create trigger catch_comments_count_del
  after delete on public.catch_comments
  for each row execute procedure public.catch_comment_count_recount();


-- ── 4. Per-user daily throttle ─────────────────────────────
create or replace function public.catch_comments_throttle()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent int;
  cap constant int := 100;
begin
  if exists (
    select 1 from public.profiles
    where id = new.user_id and ocean_sentinel_premium = true
  ) then
    return new;
  end if;

  select count(*) into recent
  from public.catch_comments
  where user_id = new.user_id
    and created_at >= now() - interval '24 hours';

  if recent >= cap then
    raise exception 'Daily comment limit reached (%/day) — try again tomorrow or upgrade to Ocean Sentinel.', cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists catch_comments_throttle_trigger on public.catch_comments;
create trigger catch_comments_throttle_trigger
  before insert on public.catch_comments
  for each row execute procedure public.catch_comments_throttle();


-- ── 5. Extend notifications.type to include catch_comment ──
-- The existing CHECK is hard to edit in-place across PG versions,
-- so we drop and re-add. The other types from earlier migrations
-- are preserved.
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('new_thread', 'new_reply', 'mention', 'catch_comment'));

-- Also add a catch_id link column so notifications can deep-link
-- back to the catch detail page.
alter table public.notifications
  add column if not exists catch_id uuid references public.catches(id) on delete cascade;


-- ── 6. notify_on_catch_comment trigger ─────────────────────
-- Notify the catch owner on a new comment (skip self-comment) and
-- parse @username mentions out of the body.
create or replace function public.notify_on_catch_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  catch_record  public.catches%rowtype;
  excerpt       text;
  link_path     text;
  mention_name  text;
  mention_id    uuid;
begin
  select * into catch_record from public.catches where id = new.catch_id;
  if not found then return new; end if;

  excerpt := left(new.body, 140);
  link_path := '/catches/' || catch_record.id::text;

  -- Notify catch owner (skip self)
  if catch_record.user_id is distinct from new.user_id then
    insert into public.notifications (user_id, type, title, body, link, catch_id)
    values (
      catch_record.user_id,
      'catch_comment',
      'New comment on your catch',
      excerpt,
      link_path,
      catch_record.id
    );
  end if;

  -- Mention notifications
  for mention_name in
    select distinct lower((regexp_matches(new.body, '@([A-Za-z0-9_-]{3,30})', 'g'))[1])
  loop
    select id into mention_id
    from public.profiles
    where username = mention_name
      and id is distinct from new.user_id
      and id is distinct from catch_record.user_id;
    if found then
      insert into public.notifications (user_id, type, title, body, link, catch_id)
      values (
        mention_id,
        'mention',
        'You were mentioned in a catch comment',
        excerpt,
        link_path,
        catch_record.id
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists catch_comments_notify on public.catch_comments;
create trigger catch_comments_notify
  after insert on public.catch_comments
  for each row execute procedure public.notify_on_catch_comment();


-- ── 7. Extend moderation_reports.target_type ──────────────
alter table public.moderation_reports
  drop constraint if exists moderation_reports_target_type_check;
alter table public.moderation_reports
  add constraint moderation_reports_target_type_check
  check (target_type in ('thread', 'reply', 'catch_comment'));

-- Extend the auto-hide trigger to handle catch_comment targets.
create or replace function public.forum_auto_hide_on_reports()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  distinct_reporters int;
  threshold constant int := 3;
begin
  if new.target_type = 'thread' then
    perform 1 from public.forum_threads where id = new.target_id and deleted_at is not null;
    if found then return new; end if;
  elsif new.target_type = 'reply' then
    perform 1 from public.forum_replies where id = new.target_id and deleted_at is not null;
    if found then return new; end if;
  elsif new.target_type = 'catch_comment' then
    perform 1 from public.catch_comments where id = new.target_id and deleted_at is not null;
    if found then return new; end if;
  end if;

  select count(distinct reporter_id) into distinct_reporters
  from public.moderation_reports
  where target_type = new.target_type
    and target_id = new.target_id
    and status = 'pending';

  if distinct_reporters >= threshold then
    if new.target_type = 'thread' then
      update public.forum_threads
        set deleted_at = now(),
            deleted_reason = 'Auto-hidden after ' || threshold || ' reports — pending admin review'
        where id = new.target_id and deleted_at is null;
    elsif new.target_type = 'reply' then
      update public.forum_replies
        set deleted_at = now(),
            deleted_reason = 'Auto-hidden after ' || threshold || ' reports — pending admin review'
        where id = new.target_id and deleted_at is null;
    elsif new.target_type = 'catch_comment' then
      update public.catch_comments
        set deleted_at = now(),
            deleted_reason = 'Auto-hidden after ' || threshold || ' reports — pending admin review'
        where id = new.target_id and deleted_at is null;
    end if;
  end if;

  return new;
end;
$$;
