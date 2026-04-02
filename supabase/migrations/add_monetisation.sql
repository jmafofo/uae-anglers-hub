-- ============================================================
-- UAE Anglers Hub — Monetisation Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── PROFILES: commercial account fields ──────────────────────
alter table public.profiles
  add column if not exists account_type          text    default 'individual',  -- individual | pro | business
  add column if not exists subscription_status   text    default 'inactive',    -- inactive | active | cancelled | trial
  add column if not exists subscription_tier     text    default 'free',        -- free | pro | business
  add column if not exists shop_name             text,
  add column if not exists shop_logo_url         text,
  add column if not exists shop_description      text,
  add column if not exists shop_website          text,
  add column if not exists shop_whatsapp         text,
  add column if not exists verified_retailer     boolean default false,
  -- ── Listing slot tracking ───────────────────────────────────
  -- free = 5 included, AED 5/extra; pro = 50; business = unlimited (-1)
  add column if not exists listing_slots_included  int     default 5,   -- slots from subscription tier
  add column if not exists listing_slots_extra     int     default 0,   -- additional purchased slots (free tier top-ups)
  add column if not exists listing_slots_used      int     default 0;   -- live non-sold active listings count

-- ── Helper: get total available listing slots for a profile ──
create or replace function public.listing_slots_available(profile_id uuid)
returns int as $$
declare
  rec record;
begin
  select listing_slots_included, listing_slots_extra, listing_slots_used, subscription_tier
  into rec
  from public.profiles
  where id = profile_id;

  -- Business tier = unlimited (return large sentinel)
  if rec.subscription_tier = 'business' then
    return 999999;
  end if;

  return (rec.listing_slots_included + rec.listing_slots_extra) - rec.listing_slots_used;
end;
$$ language plpgsql security definer;

-- ── Trigger: keep listing_slots_used in sync ─────────────────
create or replace function public.sync_listing_slot_count()
returns trigger as $$
declare
  target_user_id uuid;
begin
  -- Determine user_id from whichever row triggered this
  if TG_OP = 'DELETE' then
    target_user_id := OLD.user_id;
  else
    target_user_id := NEW.user_id;
  end if;

  update public.profiles
  set listing_slots_used = (
    select count(*) from public.listings
    where user_id = target_user_id
      and is_active = true
      and is_sold = false
  )
  where id = target_user_id;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create or replace trigger on_listing_change_sync_slots
  after insert or update or delete on public.listings
  for each row execute procedure public.sync_listing_slot_count();

-- ── Slot tier defaults: update when subscription_tier changes ─
create or replace function public.apply_tier_slot_defaults()
returns trigger as $$
begin
  if NEW.subscription_tier = 'pro' then
    NEW.listing_slots_included := 50;
    NEW.listing_slots_extra    := 0;  -- extra top-ups no longer needed
  elsif NEW.subscription_tier = 'business' then
    NEW.listing_slots_included := 999999;
    NEW.listing_slots_extra    := 0;
  else
    -- back to free
    NEW.listing_slots_included := 5;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create or replace trigger on_tier_change_apply_defaults
  before update of subscription_tier on public.profiles
  for each row execute procedure public.apply_tier_slot_defaults();

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

-- ── EXTRA SLOT PURCHASES (audit trail) ───────────────────────
-- Tracks individual AED 5 slot top-ups on the Free tier
create table if not exists public.slot_purchases (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  slots_qty     int          default 1,              -- number of slots purchased
  amount_aed    numeric(8,2) default 5.00,           -- AED 5 per slot
  payment_ref   text,                                -- Stripe payment intent ID
  created_at    timestamptz default now()
);

alter table public.slot_purchases enable row level security;
create policy "Users can view own slot purchases"
  on public.slot_purchases for select using (auth.uid() = user_id);
create policy "Auth users can insert slot purchases"
  on public.slot_purchases for insert with check (auth.uid() = user_id);

-- After a slot purchase is recorded, increment extra slots on profile
create or replace function public.apply_slot_purchase()
returns trigger as $$
begin
  update public.profiles
  set listing_slots_extra = listing_slots_extra + NEW.slots_qty
  where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql security definer;

create or replace trigger on_slot_purchase_apply
  after insert on public.slot_purchases
  for each row execute procedure public.apply_slot_purchase();

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
