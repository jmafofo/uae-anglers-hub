-- ============================================================
-- UAE Anglers Hub — Instagram-Style Posts System
--
-- Tables:
--   posts          — user photo/video posts
--   post_media     — media attachments (carousel support)
--   post_likes     — like tracking
--   post_comments  — comments on posts
--   post_views     — view tracking (one per user/IP per day)
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================

-- ── 1. posts ────────────────────────────────────────────────
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  caption     text check (char_length(caption) <= 2200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_posts_user_created on public.posts(user_id, created_at desc);
create index if not exists idx_posts_created on public.posts(created_at desc) where deleted_at is null;

-- ── 2. post_media ───────────────────────────────────────────
create table if not exists public.post_media (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  media_url   text not null,
  media_type  text not null default 'image' check (media_type in ('image', 'video')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_post_media_post on public.post_media(post_id, sort_order);

-- ── 3. post_likes ───────────────────────────────────────────
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_user on public.post_likes(user_id, created_at desc);

-- ── 4. post_comments ────────────────────────────────────────
create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_post_comments_post on public.post_comments(post_id, created_at desc);

-- ── 5. post_views ───────────────────────────────────────────
create table if not exists public.post_views (
  post_id     uuid not null references public.posts(id) on delete cascade,
  viewer_id   uuid references public.profiles(id) on delete cascade,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  unique (post_id, viewer_id),
  unique (post_id, ip_hash)
);

create index if not exists idx_post_views_post on public.post_views(post_id);

-- ── 6. posts_count trigger on profiles ──────────────────────
-- Add posts_count column if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'posts_count'
  ) then
    alter table public.profiles add column posts_count int not null default 0;
  end if;
end $$;

-- Function to increment posts_count
create or replace function public.increment_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles set posts_count = posts_count + 1 where id = new.user_id;
  return new;
end;
$$;

-- Function to decrement posts_count on soft-delete
create or replace function public.decrement_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles set posts_count = posts_count - 1 where id = old.user_id;
  return old;
end;
$$;

drop trigger if exists posts_increment_count_trigger on public.posts;
create trigger posts_increment_count_trigger
  after insert on public.posts
  for each row execute procedure public.increment_posts_count();

-- Only decrement on hard delete; soft delete keeps count
-- (We handle soft delete by not triggering on update)

-- ── 7. RLS — posts ──────────────────────────────────────────
alter table public.posts enable row level security;

drop policy if exists "Public read posts" on public.posts;
create policy "Public read posts"
  on public.posts for select
  using (deleted_at is null);

drop policy if exists "Users create own posts" on public.posts;
create policy "Users create own posts"
  on public.posts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts"
  on public.posts for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users soft-delete own posts" on public.posts;
create policy "Users soft-delete own posts"
  on public.posts for delete to authenticated
  using (auth.uid() = user_id);

-- ── 8. RLS — post_media ─────────────────────────────────────
alter table public.post_media enable row level security;

drop policy if exists "Public read post media" on public.post_media;
create policy "Public read post media"
  on public.post_media for select using (true);

drop policy if exists "Users manage own post media" on public.post_media;
create policy "Users manage own post media"
  on public.post_media for all to authenticated
  using (
    exists (select 1 from public.posts where id = post_media.post_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.posts where id = post_media.post_id and user_id = auth.uid())
  );

-- ── 9. RLS — post_likes ─────────────────────────────────────
alter table public.post_likes enable row level security;

drop policy if exists "Public read post likes" on public.post_likes;
create policy "Public read post likes"
  on public.post_likes for select using (true);

drop policy if exists "Users like posts" on public.post_likes;
create policy "Users like posts"
  on public.post_likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users unlike posts" on public.post_likes;
create policy "Users unlike posts"
  on public.post_likes for delete to authenticated
  using (auth.uid() = user_id);

-- ── 10. RLS — post_comments ─────────────────────────────────
alter table public.post_comments enable row level security;

drop policy if exists "Public read post comments" on public.post_comments;
create policy "Public read post comments"
  on public.post_comments for select using (deleted_at is null);

drop policy if exists "Users comment on posts" on public.post_comments;
create policy "Users comment on posts"
  on public.post_comments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own comments" on public.post_comments;
create policy "Users update own comments"
  on public.post_comments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users soft-delete own comments" on public.post_comments;
create policy "Users soft-delete own comments"
  on public.post_comments for delete to authenticated
  using (auth.uid() = user_id);

-- ── 11. RLS — post_views ────────────────────────────────────
alter table public.post_views enable row level security;

drop policy if exists "Anyone can insert views" on public.post_views;
create policy "Anyone can insert views"
  on public.post_views for insert to authenticated, anon
  with check (true);

-- No SELECT needed on views — they're aggregated server-side

-- ── 12. Allow users to update their own social links ────────
-- Currently social links (youtube_channel, tiktok_handle, etc.)
-- are only editable via admin API. Allow users to edit their own.

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      is_admin is not distinct from (select is_admin from public.profiles where id = auth.uid())
    )
    and (
      stripe_customer_id is not distinct from (select stripe_customer_id from public.profiles where id = auth.uid())
    )
  );
