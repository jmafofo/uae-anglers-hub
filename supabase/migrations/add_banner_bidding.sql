-- ============================================================
-- UAE Anglers Hub — Banner Ad Bidding System
--
-- Businesses bid for fixed banner placements. Pricing is based
-- on slot size × duration. Payment goes through Stripe with
-- manual capture (authorized on checkout, captured on approval).
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================

-- ── Banner slots (predefined positions) ─────────────────────
create table if not exists public.ad_banner_slots (
  id uuid primary key default gen_random_uuid(),
  position text unique not null,
  label text not null,
  description text,
  slot_type text not null default 'banner' check (slot_type in ('banner', 'marquee')),
  width_px int not null,
  height_px int not null,
  base_price_per_day numeric(10,2) not null,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

comment on table public.ad_banner_slots is 'Predefined banner ad placements with base pricing';
comment on column public.ad_banner_slots.base_price_per_day is 'AED per day before any adjustments';

-- Seed initial slots
insert into public.ad_banner_slots (position, label, description, slot_type, width_px, height_px, base_price_per_day, sort_order)
values
  ('home_top_marquee',     'Homepage Marquee',        'Scrolling marquee banner at the top of the homepage',       'marquee',  1200, 60,  100.00, 1),
  ('home_left_sidebar',    'Homepage Left Sidebar',   'Vertical banner on the left side of the homepage hero',      'banner',   300,  600, 75.00,  2),
  ('home_right_sidebar',   'Homepage Right Sidebar',  'Vertical banner on the right side of the homepage hero',     'banner',   300,  600, 75.00,  3),
  ('community_sidebar',    'Community Sidebar',       'Vertical banner in the community forum pages',               'banner',   300,  600, 50.00,  4),
  ('spots_sidebar',        'Spots Sidebar',           'Vertical banner on fishing spot detail pages',               'banner',   300,  600, 60.00,  5)
on conflict (position) do update set
  label = excluded.label,
  description = excluded.description,
  slot_type = excluded.slot_type,
  width_px = excluded.width_px,
  height_px = excluded.height_px,
  base_price_per_day = excluded.base_price_per_day,
  sort_order = excluded.sort_order;

-- Deactivate old slots that are no longer used
do $$
begin
  update public.ad_banner_slots set is_active = false where position in ('home_top_banner', 'home_bottom_banner');
end $$;

-- ── Banner bids ─────────────────────────────────────────────
create table if not exists public.ad_banner_bids (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ad_banner_slots(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  business_email text not null,
  image_url text,
  marquee_text text,
  target_url text not null,
  duration_days int not null check (duration_days >= 1 and duration_days <= 90),
  start_date date,
  total_amount_aed numeric(10,2) not null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text unique,
  stripe_capture_status text default 'authorized' check (stripe_capture_status in ('authorized', 'captured', 'cancelled', 'refunded')),
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'active', 'rejected', 'expired', 'cancelled')),
  admin_notes text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  ends_at timestamptz
);

comment on table public.ad_banner_bids is 'Bids for banner ad placements';
comment on column public.ad_banner_bids.status is 'draft → pending_approval → active | rejected | cancelled. expired set by cron.';
comment on column public.ad_banner_bids.stripe_capture_status is 'Stripe PaymentIntent capture state';

-- Indexes (idempotent)
create index if not exists idx_banner_bids_slot_status on public.ad_banner_bids(slot_id, status);
create index if not exists idx_banner_bids_ends_at on public.ad_banner_bids(ends_at) where ends_at is not null;
create index if not exists idx_banner_bids_user on public.ad_banner_bids(user_id);
create index if not exists idx_banner_bids_checkout_session on public.ad_banner_bids(stripe_checkout_session_id);

-- ── RLS ─────────────────────────────────────────────────────
alter table if exists public.ad_banner_slots enable row level security;
alter table if exists public.ad_banner_bids enable row level security;

-- Slots: public read
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banner_slots' and policyname = 'Public read banner slots'
  ) then
    create policy "Public read banner slots"
      on public.ad_banner_slots for select
      using (true);
  end if;
end $$;

-- Bids: users read own, admin reads all
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banner_bids' and policyname = 'Users read own banner bids'
  ) then
    create policy "Users read own banner bids"
      on public.ad_banner_bids for select to authenticated
      using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  end if;
end $$;

-- Bids: authenticated users can create their own
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banner_bids' and policyname = 'Users create own banner bids'
  ) then
    create policy "Users create own banner bids"
      on public.ad_banner_bids for insert to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- Bids: only admin can update
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banner_bids' and policyname = 'Admin update banner bids'
  ) then
    create policy "Admin update banner bids"
      on public.ad_banner_bids for update to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  end if;
end $$;

-- Bids: only admin or owner can delete (owner only when draft)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banner_bids' and policyname = 'Owner delete draft bids'
  ) then
    create policy "Owner delete draft bids"
      on public.ad_banner_bids for delete to authenticated
      using (user_id = auth.uid() and status = 'draft');
  end if;
end $$;

-- ── Function: get active banner for slot ────────────────────
create or replace function public.get_active_banner(p_position text)
returns table (
  bid_id uuid,
  business_name text,
  image_url text,
  marquee_text text,
  target_url text,
  width_px int,
  height_px int,
  slot_type text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id as bid_id,
    b.business_name,
    b.image_url,
    b.marquee_text,
    b.target_url,
    s.width_px,
    s.height_px,
    s.slot_type
  from public.ad_banner_bids b
  join public.ad_banner_slots s on s.id = b.slot_id
  where s.position = p_position
    and b.status = 'active'
    and (b.start_date is null or b.start_date <= current_date)
    and (b.ends_at is null or b.ends_at > now())
  order by b.approved_at desc
  limit 1;
$$;

-- ── Cleanup trigger: expire old banners ─────────────────────
create or replace function public.expire_old_banner_bids()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ad_banner_bids
  set status = 'expired'
  where status = 'active'
    and ends_at is not null
    and ends_at <= now();
  return null;
end;
$$;

-- Run periodically via pg_cron or application-level cron
-- For now, a trigger on any bid query is too heavy; rely on app-level checks
-- and a periodic cleanup job.
