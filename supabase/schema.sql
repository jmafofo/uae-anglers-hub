-- ============================================================
-- UAE Anglers Hub — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  emirate text,
  total_catches int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), '[^a-z0-9]', '', 'g')),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CATCHES
create table if not exists public.catches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  species text not null,
  weight_kg numeric(6,2),
  length_cm numeric(6,1),
  bait text,
  technique text,
  location_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  emirate text,
  photo_url text,
  notes text,
  is_public boolean default true,
  caught_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.catches enable row level security;

create policy "Public catches are viewable by everyone"
  on public.catches for select using (is_public = true);

create policy "Users can view their own private catches"
  on public.catches for select using (auth.uid() = user_id);

create policy "Users can insert their own catches"
  on public.catches for insert with check (auth.uid() = user_id);

create policy "Users can update their own catches"
  on public.catches for update using (auth.uid() = user_id);

create policy "Users can delete their own catches"
  on public.catches for delete using (auth.uid() = user_id);

-- Update total_catches on profile
create or replace function public.update_catch_count()
returns trigger as $$
begin
  update public.profiles
  set total_catches = (
    select count(*) from public.catches where user_id = new.user_id
  )
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_catch_inserted
  after insert on public.catches
  for each row execute procedure public.update_catch_count();

-- Storage bucket for catch photos
insert into storage.buckets (id, name, public)
values ('catches', 'catches', true)
on conflict do nothing;

create policy "Anyone can view catch photos"
  on storage.objects for select using (bucket_id = 'catches');

create policy "Authenticated users can upload catch photos"
  on storage.objects for insert
  with check (bucket_id = 'catches' and auth.role() = 'authenticated');

-- ============================================================
-- PHASE 3 — Forum, Tournaments, Marketplace
-- ============================================================

-- FORUM CATEGORIES
create table if not exists public.forum_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text default '💬',
  thread_count int default 0,
  created_at timestamptz default now()
);
alter table public.forum_categories enable row level security;
create policy "Forum categories viewable by all" on public.forum_categories for select using (true);

insert into public.forum_categories (name, slug, description, icon) values
  ('Fishing Spots & Tips', 'spots-tips', 'Share your favourite spots and local knowledge', '📍'),
  ('Catch Reports', 'catch-reports', 'Log your sessions and show off your catches', '🐟'),
  ('Gear & Tackle', 'gear-tackle', 'Rods, reels, lures — what works in UAE waters', '🎣'),
  ('Tournaments & Events', 'tournaments-events', 'Upcoming competitions and event announcements', '🏆'),
  ('Regulations & Rules', 'regulations-rules', 'UAE fishing laws, licensing, protected species', '📋'),
  ('General Discussion', 'general', 'Anything fishing-related goes here', '💬')
on conflict do nothing;

-- FORUM THREADS
create table if not exists public.forum_threads (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.forum_categories(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  tags text[] default '{}',
  upvotes int default 0,
  reply_count int default 0,
  is_pinned boolean default false,
  is_locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.forum_threads enable row level security;
create policy "Threads viewable by all" on public.forum_threads for select using (true);
create policy "Auth users can create threads" on public.forum_threads for insert with check (auth.uid() = user_id);
create policy "Users can update own threads" on public.forum_threads for update using (auth.uid() = user_id);

-- FORUM REPLIES
create table if not exists public.forum_replies (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  upvotes int default 0,
  is_helpful boolean default false,
  created_at timestamptz default now()
);
alter table public.forum_replies enable row level security;
create policy "Replies viewable by all" on public.forum_replies for select using (true);
create policy "Auth users can reply" on public.forum_replies for insert with check (auth.uid() = user_id);

-- Auto-increment reply_count
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  update public.forum_threads set reply_count = reply_count + 1, updated_at = now() where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer;
create or replace trigger on_reply_inserted
  after insert on public.forum_replies for each row execute procedure public.increment_reply_count();

-- TOURNAMENTS
create table if not exists public.tournaments (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  emirate text,
  location_name text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  scoring_type text default 'heaviest',
  target_species text,
  prize_description text,
  max_participants int,
  participant_count int default 0,
  status text default 'upcoming',
  created_at timestamptz default now()
);
alter table public.tournaments enable row level security;
create policy "Tournaments viewable by all" on public.tournaments for select using (true);
create policy "Auth users can create tournaments" on public.tournaments for insert with check (auth.uid() = created_by);

-- TOURNAMENT PARTICIPANTS
create table if not exists public.tournament_participants (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_score numeric(10,3) default 0,
  catch_count int default 0,
  registered_at timestamptz default now(),
  unique(tournament_id, user_id)
);
alter table public.tournament_participants enable row level security;
create policy "Participants viewable by all" on public.tournament_participants for select using (true);
create policy "Auth users can join" on public.tournament_participants for insert with check (auth.uid() = user_id);

-- MARKETPLACE LISTINGS
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null,
  condition text not null,
  price numeric(10,2),
  listing_type text default 'fixed',
  emirate text,
  photos text[] default '{}',
  contact_whatsapp text,
  contact_email text,
  is_sold boolean default false,
  is_active boolean default true,
  views int default 0,
  created_at timestamptz default now()
);
alter table public.listings enable row level security;
create policy "Active listings viewable by all" on public.listings for select using (is_active = true);
create policy "Auth users can post listings" on public.listings for insert with check (auth.uid() = user_id);
create policy "Users can update own listings" on public.listings for update using (auth.uid() = user_id);

-- Phase 4: Add scientific_name to catches (run separately if table already exists)
-- alter table public.catches add column if not exists scientific_name text;
