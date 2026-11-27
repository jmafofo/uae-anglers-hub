-- Curated creator/brand associations. Only admins can assert an association;
-- the server separately requires a current captured homepage booking.
create table if not exists public.film_brand_placements (
  id uuid primary key default gen_random_uuid(),
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  advertiser_id uuid not null references public.profiles(id) on delete cascade,
  brand_name text not null check (char_length(brand_name) between 1 and 80),
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  target_url text not null check (target_url ~ '^https://'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(video_id, advertiser_id, brand_name)
);
alter table public.film_brand_placements enable row level security;
create policy "Admins manage film brands" on public.film_brand_placements
  for all to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin));
