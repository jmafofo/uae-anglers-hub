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
