-- ============================================================
-- UAE Anglers Hub — Trending news + live seasonal ban surface
--
-- Adds:
--   1. `news_items` — admin-curated articles for the landing
--      page (fishing, marine life, regulation updates, events).
--   2. `is_ban_active()` — pure SQL helper that evaluates a
--      recurring annual ban window against today, correctly
--      handling wrap-around windows (e.g. Nov 15 → Feb 28).
--   3. `current_seasonal_bans()` — returns all fishing
--      regulations currently in effect with their species
--      slugs so the landing page can render fish images.
-- ============================================================

-- ── news_items ──────────────────────────────────────────────
create table if not exists public.news_items (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  category       text not null check (category in
    ('fishing','marine_life','regulation','tournament','conservation')),
  headline       text not null,
  excerpt        text,
  body           text,
  hero_image_url text,
  source_url     text,
  source_name    text,
  is_featured    boolean not null default false,
  published_at   timestamptz not null default now(),
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

create index if not exists news_items_published_ix
  on public.news_items (published_at desc);
create index if not exists news_items_category_ix
  on public.news_items (category, published_at desc);

alter table public.news_items enable row level security;

create policy "News viewable by all"
  on public.news_items for select using (true);

create policy "Admins insert news"
  on public.news_items for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

create policy "Admins update news"
  on public.news_items for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

create policy "Admins delete news"
  on public.news_items for delete
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

-- ── is_ban_active: evaluate a recurring annual window ──────
-- Returns true if `today` falls inside the (m1,d1)→(m2,d2)
-- window, honouring wrap-around. Pure/immutable so callers
-- can inline it into view predicates.
create or replace function public.is_ban_active(
  start_m int, start_d int,
  end_m   int, end_d   int,
  today   date default current_date
) returns boolean language plpgsql immutable as $$
declare
  y int := extract(year from today)::int;
  s date;
  e date;
begin
  if start_m is null or start_d is null or end_m is null or end_d is null then
    return false;
  end if;
  s := make_date(y, start_m, start_d);
  e := make_date(y, end_m,   end_d);
  if s <= e then
    return today between s and e;
  else
    -- wraps year end (e.g. 15 Nov → 28 Feb)
    return today >= s or today <= e;
  end if;
end;
$$;

-- ── current_seasonal_bans: what's banned right now ─────────
create or replace function public.current_seasonal_bans()
returns table (
  id               uuid,
  title            text,
  description      text,
  species_slugs    text[],
  species_names    text[],
  ban_start_month  int,
  ban_start_day    int,
  ban_end_month    int,
  ban_end_day      int,
  ban_scope        text,
  authority        text,
  source_url       text,
  applies_to_coast text
) language sql stable as $$
  select
    r.id, r.title, r.description,
    r.species_slugs, r.species_names,
    r.ban_start_month, r.ban_start_day,
    r.ban_end_month, r.ban_end_day,
    r.ban_scope, r.authority, r.source_url, r.applies_to_coast
  from public.fishing_regulations r
  where r.is_active = true
    and r.regulation_type = 'seasonal_ban'
    and public.is_ban_active(
      r.ban_start_month, r.ban_start_day,
      r.ban_end_month,   r.ban_end_day)
  order by r.ban_start_month, r.ban_start_day;
$$;

grant execute on function public.is_ban_active(int, int, int, int, date) to anon, authenticated;
grant execute on function public.current_seasonal_bans() to anon, authenticated;
