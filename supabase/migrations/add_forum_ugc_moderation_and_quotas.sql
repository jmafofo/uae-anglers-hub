-- ============================================================
-- UAE Anglers Hub — Forum UGC ownership, notifications & quotas
--
-- Closes three review gaps:
--   1. Users couldn't delete their own threads/replies and couldn't
--      edit replies at all (RLS update/delete policies missing).
--   2. The `new_reply` and `mention` notification types existed in
--      the check constraint but no trigger ever inserted them —
--      thread authors never got told about replies.
--   3. Forum writes go directly through the client-side Supabase
--      client (no API route to gate), so a logged-in user could
--      hammer thread/reply inserts with no per-user cap. BEFORE
--      INSERT triggers enforce a daily quota in PG, no app change
--      needed for the limit itself.
-- ============================================================

-- ── 1. Edited-at columns ────────────────────────────────────
alter table public.forum_threads
  add column if not exists edited_at timestamptz;

alter table public.forum_replies
  add column if not exists edited_at timestamptz;

create or replace function public.touch_edited_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Only flag as edited if the content actually changed (skip pure
  -- counter bumps like upvotes / reply_count).
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
  end if;
  return new;
end;
$$;

drop trigger if exists forum_threads_touch_edited_at on public.forum_threads;
create trigger forum_threads_touch_edited_at
  before update on public.forum_threads
  for each row execute procedure public.touch_edited_at();

drop trigger if exists forum_replies_touch_edited_at on public.forum_replies;
create trigger forum_replies_touch_edited_at
  before update on public.forum_replies
  for each row execute procedure public.touch_edited_at();


-- ── 2. Missing RLS policies ─────────────────────────────────
-- Authors can update their own replies (threads already had this).
drop policy if exists "Users can update own replies" on public.forum_replies;
create policy "Users can update own replies"
  on public.forum_replies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authors can delete their own threads and replies.
drop policy if exists "Users can delete own threads" on public.forum_threads;
create policy "Users can delete own threads"
  on public.forum_threads for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own replies" on public.forum_replies;
create policy "Users can delete own replies"
  on public.forum_replies for delete
  using (auth.uid() = user_id);


-- ── 3. Tag validation ──────────────────────────────────────
-- Cap at 5 tags, 20 chars each, lower-kebab only. Stops spammers
-- from indexing 10kB tag arrays per thread.
--
-- Postgres rejects subqueries inside CHECK constraints, so the
-- per-element validation lives in an IMMUTABLE function and the
-- CHECK just calls it. Functions called from CHECK constraints
-- are allowed to use any SQL internally as long as they're
-- declared IMMUTABLE.
create or replace function public.forum_tags_valid(t text[])
returns boolean
language plpgsql
immutable
set search_path = pg_temp
as $$
declare
  x text;
  n int;
begin
  if t is null then return true; end if;
  n := coalesce(array_length(t, 1), 0);
  if n = 0 then return true; end if;
  if n > 5 then return false; end if;
  foreach x in array t loop
    if length(x) > 20 then return false; end if;
    if x !~ '^[a-z0-9-]+$' then return false; end if;
  end loop;
  return true;
end;
$$;

alter table public.forum_threads
  drop constraint if exists forum_threads_tags_check;
alter table public.forum_threads
  add constraint forum_threads_tags_check
  check (public.forum_tags_valid(tags));


-- ── 4. Per-user daily throttle ─────────────────────────────
-- BEFORE INSERT triggers raising an exception are the simplest
-- form of DB-side rate limiting. The mobile app / web client
-- surface the friendly message via the standard Postgres error
-- channel (PGRST error → toast).
create or replace function public.forum_throttle_threads()
returns trigger
language plpgsql
security definer  -- needs to read regardless of caller RLS
set search_path = public, pg_temp
as $$
declare
  recent int;
  cap constant int := 10;
begin
  -- Premium subscribers bypass the cap.
  if exists (
    select 1 from public.profiles
    where id = new.user_id and ocean_sentinel_premium = true
  ) then
    return new;
  end if;

  select count(*) into recent
  from public.forum_threads
  where user_id = new.user_id
    and created_at >= now() - interval '24 hours';

  if recent >= cap then
    raise exception 'Daily thread limit reached (%/day) — try again tomorrow or upgrade to Ocean Sentinel.', cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists forum_threads_throttle on public.forum_threads;
create trigger forum_threads_throttle
  before insert on public.forum_threads
  for each row execute procedure public.forum_throttle_threads();


create or replace function public.forum_throttle_replies()
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
  from public.forum_replies
  where user_id = new.user_id
    and created_at >= now() - interval '24 hours';

  if recent >= cap then
    raise exception 'Daily reply limit reached (%/day) — try again tomorrow or upgrade to Ocean Sentinel.', cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists forum_replies_throttle on public.forum_replies;
create trigger forum_replies_throttle
  before insert on public.forum_replies
  for each row execute procedure public.forum_throttle_replies();


-- ── 5. new_reply + mention notifications ───────────────────
-- Fires AFTER insert on forum_replies. Notifies thread author of
-- the reply and parses @username mentions out of the body.
create or replace function public.notify_on_new_reply()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  thread_record public.forum_threads%rowtype;
  cat_record    public.forum_categories%rowtype;
  reply_excerpt text;
  mention_name  text;
  mention_id    uuid;
  link_path     text;
begin
  select * into thread_record from public.forum_threads where id = new.thread_id;
  if not found then return new; end if;
  select * into cat_record from public.forum_categories where id = thread_record.category_id;

  reply_excerpt := left(new.body, 140);
  link_path := '/forum/thread/' || thread_record.id::text;

  -- (a) Notify thread author about a new reply (skip self-replies).
  if thread_record.user_id is distinct from new.user_id then
    insert into public.notifications (user_id, type, title, body, link, thread_id)
    values (
      thread_record.user_id,
      'new_reply',
      'New reply on "' || left(thread_record.title, 60) || '"',
      reply_excerpt,
      link_path,
      thread_record.id
    );
  end if;

  -- (b) Mention notifications. Parse distinct @username matches
  --     out of the body, skip the replier and the thread author
  --     (who already got the new_reply notification above).
  for mention_name in
    select distinct lower((regexp_matches(new.body, '@([A-Za-z0-9_-]{3,30})', 'g'))[1])
  loop
    select id into mention_id
    from public.profiles
    where username = mention_name
      and id is distinct from new.user_id
      and id is distinct from thread_record.user_id;
    if found then
      insert into public.notifications (user_id, type, title, body, link, thread_id)
      values (
        mention_id,
        'mention',
        'You were mentioned in a reply',
        reply_excerpt,
        link_path,
        thread_record.id
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists forum_replies_notify on public.forum_replies;
create trigger forum_replies_notify
  after insert on public.forum_replies
  for each row execute procedure public.notify_on_new_reply();


-- ── 6. Extend new_thread trigger to also fire @mention pings ─
-- The existing notify_on_new_thread covers subscribers. Add a
-- separate trigger so the two concerns stay independent.
create or replace function public.notify_on_thread_mentions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  body_excerpt  text;
  mention_name  text;
  mention_id    uuid;
  link_path     text;
begin
  -- Only public threads trigger mention pings — followers/private
  -- threads shouldn't leak the title to non-followers.
  if new.visibility <> 'public' then
    return new;
  end if;

  body_excerpt := left(new.body, 140);
  link_path := '/forum/thread/' || new.id::text;

  for mention_name in
    select distinct lower(m[1])
    from (
      select (regexp_matches(coalesce(new.title, '') || ' ' || coalesce(new.body, ''),
                             '@([A-Za-z0-9_-]{3,30})', 'g')) as m
    ) as matches
  loop
    select id into mention_id
    from public.profiles
    where username = mention_name
      and id is distinct from new.user_id;
    if found then
      insert into public.notifications (user_id, type, title, body, link, thread_id)
      values (
        mention_id,
        'mention',
        'You were mentioned in a thread',
        body_excerpt,
        link_path,
        new.id
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists forum_threads_notify_mentions on public.forum_threads;
create trigger forum_threads_notify_mentions
  after insert on public.forum_threads
  for each row execute procedure public.notify_on_thread_mentions();
