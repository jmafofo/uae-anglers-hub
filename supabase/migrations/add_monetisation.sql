-- ============================================================
-- UAE Anglers Hub — Monetisation Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── PROFILES: commercial account fields ──────────────────────
alter table public.profiles
  add column if not exists account_type        text    default 'individual',  -- individual | pro | business
  add column if not exists subscription_status text    default 'inactive',    -- inactive | active | cancelled | trial
  add column if not exists subscription_tier   text,                          -- free | pro | business
  add column if not exists shop_name           text,
  add column if not exists shop_logo_url       text,
  add column if not exists shop_description    text,
  add column if not exists shop_website        text,
  add column if not exists shop_whatsapp       text,
  add column if not exists verified_retailer   boolean default false;

-- ── LISTINGS: boosting + commercial seller flags ─────────────
alter table public.listings
  add column if not exists is_boosted    boolean   default false,
  add column if not exists boosted_until timestamptz,
  add column if not exists seller_type   text      default 'individual';  -- individual | commercial

-- Index for efficient boosted-first ordering
create index if not exists idx_listings_boosted
  on public.listings (is_boosted desc, boosted_until desc, created_at desc)
  where is_active = true and is_sold = false;

-- Index for commercial seller listings
create index if not exists idx_listings_seller_type
  on public.listings (seller_type)
  where is_active = true;

-- ── SPOT SPONSORSHIPS ─────────────────────────────────────────
create table if not exists public.spot_sponsorships (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  spot_slug     text not null,                  -- matches spot slug from lib/spots.ts
  sponsor_name  text not null,
  sponsor_logo  text,
  sponsor_url   text,
  is_active     boolean default true,
  starts_at     timestamptz default now(),
  ends_at       timestamptz,
  created_at    timestamptz default now(),
  unique (spot_slug)                            -- one sponsor per spot at a time
);

alter table public.spot_sponsorships enable row level security;
create policy "Spot sponsorships viewable by all"
  on public.spot_sponsorships for select using (is_active = true);
create policy "Auth users can create sponsorships"
  on public.spot_sponsorships for insert with check (auth.uid() = user_id);

-- ── BOOST PURCHASES (audit trail) ────────────────────────────
create table if not exists public.boost_purchases (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  listing_id    uuid references public.listings(id) on delete cascade not null,
  amount_aed    numeric(8,2) default 20.00,
  duration_days int         default 7,
  boosted_from  timestamptz default now(),
  boosted_until timestamptz generated always as (boosted_from + (duration_days || ' days')::interval) stored,
  payment_ref   text,                           -- Stripe payment intent ID when integrated
  created_at    timestamptz default now()
);

alter table public.boost_purchases enable row level security;
create policy "Users can view own boost purchases"
  on public.boost_purchases for select using (auth.uid() = user_id);
create policy "Auth users can insert boost purchases"
  on public.boost_purchases for insert with check (auth.uid() = user_id);

-- ── Helper: expire boosts automatically (call via cron or edge fn) ───
-- This function deactivates boosts whose boosted_until has passed
create or replace function public.expire_boosts()
returns void as $$
begin
  update public.listings
  set is_boosted = false
  where is_boosted = true
    and boosted_until is not null
    and boosted_until < now();
end;
$$ language plpgsql security definer;
