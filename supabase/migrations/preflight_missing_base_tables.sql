-- ============================================================
-- UAE Anglers Hub — Preflight: missing base tables
--
-- The database is missing three tables that live in the canonical
-- schema.sql but were never applied:
--   - follows
--   - forum_category_subscriptions
--   - notifications
--
-- Several of the later migrations (forum UGC triggers, realtime
-- publication, catch comments) depend on `notifications` existing,
-- so they fail with "relation public.notifications does not exist"
-- until this preflight runs.
--
-- This file is an exact extract of those three sections from
-- supabase/schema.sql, made idempotent so it's safe to re-run
-- against partially-set-up databases.
--
-- Apply this BEFORE any of:
--   add_forum_ugc_moderation_and_quotas.sql
--   enable_realtime_notifications.sql
--   add_catch_comments.sql
-- ============================================================

-- ── follows ────────────────────────────────────────────────
create table if not exists public.follows (
  id            uuid default gen_random_uuid() primary key,
  follower_id   uuid references public.profiles(id) on delete cascade not null,
  following_id  uuid references public.profiles(id) on delete cascade not null,
  created_at    timestamptz default now(),
  unique (follower_id, following_id)
);

alter table public.follows enable row level security;

drop policy if exists "Follows viewable by all" on public.follows;
create policy "Follows viewable by all"
  on public.follows for select using (true);

drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);


-- ── forum_category_subscriptions ───────────────────────────
create table if not exists public.forum_category_subscriptions (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  category_id         uuid references public.forum_categories(id) on delete cascade not null,
  notify_new_threads  boolean default true,
  created_at          timestamptz default now(),
  unique (user_id, category_id)
);

alter table public.forum_category_subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.forum_category_subscriptions;
create policy "Users can view own subscriptions"
  on public.forum_category_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Users can manage own subscriptions" on public.forum_category_subscriptions;
create policy "Users can manage own subscriptions"
  on public.forum_category_subscriptions for all using (auth.uid() = user_id);

-- Auto-subscribe new profiles to all categories (matches schema.sql).
create or replace function public.auto_subscribe_to_categories()
returns trigger as $$
begin
  insert into public.forum_category_subscriptions (user_id, category_id, notify_new_threads)
  select new.id, id, true from public.forum_categories;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_subscribe_categories on public.profiles;
create trigger on_profile_created_subscribe_categories
  after insert on public.profiles
  for each row execute procedure public.auto_subscribe_to_categories();


-- ── notifications ──────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null check (type in ('new_thread', 'new_reply', 'mention')),
  title       text not null,
  body        text,
  link        text,
  thread_id   uuid references public.forum_threads(id) on delete cascade,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- Notify subscribers on new thread
create or replace function public.notify_on_new_thread()
returns trigger as $$
begin
  if new.visibility = 'public' then
    insert into public.notifications (user_id, type, title, body, link, thread_id)
    select
      s.user_id,
      'new_thread',
      'New thread in ' || c.name,
      new.title,
      '/forum/thread/' || new.id,
      new.id
    from public.forum_category_subscriptions s
    join public.forum_categories c on c.id = s.category_id
    where s.category_id = new.category_id
      and s.notify_new_threads = true
      and s.user_id != new.user_id;

  elsif new.visibility = 'followers' then
    insert into public.notifications (user_id, type, title, body, link, thread_id)
    select
      s.user_id,
      'new_thread',
      'New thread in ' || c.name,
      new.title,
      '/forum/thread/' || new.id,
      new.id
    from public.forum_category_subscriptions s
    join public.forum_categories c on c.id = s.category_id
    where s.category_id = new.category_id
      and s.notify_new_threads = true
      and s.user_id != new.user_id
      and s.user_id in (
        select follower_id from public.follows where following_id = new.user_id
      );

  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_created_notify on public.forum_threads;
create trigger on_thread_created_notify
  after insert on public.forum_threads
  for each row execute procedure public.notify_on_new_thread();
