-- ============================================================
-- UAE Anglers Hub — Native ad sponsorships
--
-- Cost-recovery layer for Ocean Sentinel: sponsor-paid placements
-- shown to free-tier users so the Claude Vision bill is offset.
-- Premium users (ocean_sentinel_premium = true) bypass ads
-- entirely — that's the explicit upgrade.
--
-- Pricing model: CPM (cost per 1000 impressions). Each impression
-- decrements the campaign's spent_aed counter; campaign is auto-
-- deactivated when spent_aed >= budget_aed. Truth lives in
-- ad_impressions; the campaign counter is denormalized for fast
-- "remaining budget" checks at serve time.
--
-- Targeting: campaigns can target species (e.g. "Bu Tinah Tackle"
-- targeting Hammour anglers) and emirates (e.g. "Al Khan Bait Shop"
-- only shown for Sharjah-coast spots). Untargeted campaigns
-- compete at lower priority.
-- ============================================================

-- ── ad_sponsors ─────────────────────────────────────────────
create table if not exists public.ad_sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  logo_url    text check (logo_url is null or logo_url ~* '^https?://'),
  website     text check (website is null or website ~* '^https?://'),
  whatsapp    text,
  emirate     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id)
);

alter table public.ad_sponsors enable row level security;

drop policy if exists "Sponsors viewable by all" on public.ad_sponsors;
create policy "Sponsors viewable by all"
  on public.ad_sponsors for select using (true);

drop policy if exists "Admins manage sponsors" on public.ad_sponsors;
create policy "Admins manage sponsors"
  on public.ad_sponsors for all
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

-- ── ad_campaigns ────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id              uuid primary key default gen_random_uuid(),
  sponsor_id      uuid not null references public.ad_sponsors(id) on delete cascade,
  placement       text not null check (placement in
    ('identify_result', 'spot_sidebar', 'home_banner', 'ban_banner')),

  -- Creative (rendered in the slot)
  headline        text not null check (char_length(headline) <= 120),
  body            text check (body is null or char_length(body) <= 280),
  image_url       text check (image_url is null or image_url ~* '^https?://'),
  cta_text        text not null default 'Learn more' check (char_length(cta_text) <= 30),
  target_url      text not null check (target_url ~* '^https?://'),

  -- Targeting (matched against context passed to /api/ads/next)
  target_species  text[] not null default '{}',
  target_emirates text[] not null default '{}',

  -- Pricing (CPM)
  cpm_aed         numeric(10,2) not null check (cpm_aed >= 0),
  budget_aed      numeric(10,2) not null check (budget_aed >= 0),

  -- Scheduling
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz,
  is_active       boolean not null default true,
  priority        int not null default 0,

  -- Denormalised counters (truth = ad_impressions / ad_clicks tables)
  impressions_count int not null default 0,
  clicks_count      int not null default 0,
  spent_aed         numeric(10,2) not null default 0,

  created_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id)
);

create index if not exists ad_campaigns_active_ix
  on public.ad_campaigns (placement, is_active, ends_at);
create index if not exists ad_campaigns_species_ix
  on public.ad_campaigns using gin (target_species);
create index if not exists ad_campaigns_emirates_ix
  on public.ad_campaigns using gin (target_emirates);

alter table public.ad_campaigns enable row level security;

drop policy if exists "Campaigns viewable by all" on public.ad_campaigns;
create policy "Campaigns viewable by all"
  on public.ad_campaigns for select using (true);

drop policy if exists "Admins manage campaigns" on public.ad_campaigns;
create policy "Admins manage campaigns"
  on public.ad_campaigns for all
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

-- ── ad_impressions ──────────────────────────────────────────
create table if not exists public.ad_impressions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  placement   text not null,
  context     jsonb,
  charged_aed numeric(10,4) not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists ad_impressions_campaign_ix
  on public.ad_impressions (campaign_id, created_at desc);

alter table public.ad_impressions enable row level security;
-- No write policies — service-role only writes (via API routes).
-- Admins read via the joined campaigns table for analytics.
drop policy if exists "Admins read impressions" on public.ad_impressions;
create policy "Admins read impressions"
  on public.ad_impressions for select
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

-- ── ad_clicks ───────────────────────────────────────────────
create table if not exists public.ad_clicks (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.ad_campaigns(id) on delete cascade,
  impression_id uuid references public.ad_impressions(id) on delete set null,
  user_id       uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists ad_clicks_campaign_ix
  on public.ad_clicks (campaign_id, created_at desc);

alter table public.ad_clicks enable row level security;
drop policy if exists "Admins read clicks" on public.ad_clicks;
create policy "Admins read clicks"
  on public.ad_clicks for select
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

-- ── Picker RPC: choose the next ad for a placement+context ──
-- Scoring:
--   +10  target_species && context.species  (species overlap)
--   +5   target_emirates contains context.emirate
--   +priority (admin tunable)
-- Only returns campaigns that are active, within their date
-- window, and have remaining budget.
create or replace function public.pick_next_ad(
  p_placement text,
  p_species   text default null,
  p_emirate   text default null
) returns table (
  id              uuid,
  sponsor_id      uuid,
  sponsor_name    text,
  sponsor_logo    text,
  headline        text,
  body            text,
  image_url       text,
  cta_text        text,
  target_url      text,
  cpm_aed         numeric,
  charge_aed      numeric
) language sql stable security invoker
  set search_path = public, pg_temp as $$
  with scored as (
    select
      c.id, c.sponsor_id, s.name as sponsor_name, s.logo_url as sponsor_logo,
      c.headline, c.body, c.image_url, c.cta_text, c.target_url,
      c.cpm_aed,
      (c.cpm_aed / 1000.0)::numeric(10,4) as charge_aed,
      (
        case when p_species is not null
              and c.target_species && array[lower(p_species)]
             then 10 else 0 end
        + case when p_emirate is not null
                and p_emirate = any(c.target_emirates)
               then 5 else 0 end
        + c.priority
      ) as score
    from public.ad_campaigns c
    join public.ad_sponsors s on s.id = c.sponsor_id and s.is_active = true
    where c.is_active = true
      and c.placement = p_placement
      and c.starts_at <= now()
      and (c.ends_at is null or c.ends_at > now())
      and c.spent_aed < c.budget_aed
  )
  select id, sponsor_id, sponsor_name, sponsor_logo,
         headline, body, image_url, cta_text, target_url,
         cpm_aed, charge_aed
  from scored
  order by score desc, random()
  limit 1;
$$;

grant execute on function public.pick_next_ad(text, text, text) to anon, authenticated;

-- ── Recorder RPC: insert impression + decrement budget atomically
create or replace function public.record_ad_impression(
  p_campaign_id uuid,
  p_placement   text,
  p_user_id     uuid default null,
  p_context     jsonb default null
) returns uuid language plpgsql security definer
  set search_path = public, pg_temp as $$
declare
  charge numeric(10,4);
  imp_id uuid;
begin
  -- Pull the per-impression charge for this campaign.
  select (cpm_aed / 1000.0)::numeric(10,4) into charge
  from public.ad_campaigns where id = p_campaign_id;
  if charge is null then
    raise exception 'campaign not found';
  end if;

  insert into public.ad_impressions
    (campaign_id, user_id, placement, context, charged_aed)
  values
    (p_campaign_id, p_user_id, p_placement, p_context, charge)
  returning id into imp_id;

  update public.ad_campaigns
  set impressions_count = impressions_count + 1,
      spent_aed         = spent_aed + charge,
      is_active         = case when spent_aed + charge >= budget_aed
                          then false else is_active end
  where id = p_campaign_id;

  return imp_id;
end;
$$;

grant execute on function public.record_ad_impression(uuid, text, uuid, jsonb) to anon, authenticated;

-- ── Recorder RPC: clicks
create or replace function public.record_ad_click(
  p_campaign_id   uuid,
  p_impression_id uuid default null,
  p_user_id       uuid default null
) returns void language plpgsql security definer
  set search_path = public, pg_temp as $$
begin
  insert into public.ad_clicks (campaign_id, impression_id, user_id)
  values (p_campaign_id, p_impression_id, p_user_id);

  update public.ad_campaigns
  set clicks_count = clicks_count + 1
  where id = p_campaign_id;
end;
$$;

grant execute on function public.record_ad_click(uuid, uuid, uuid) to anon, authenticated;
