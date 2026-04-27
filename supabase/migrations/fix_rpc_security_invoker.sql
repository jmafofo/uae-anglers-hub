-- ── Convert RPC helpers from SECURITY DEFINER → SECURITY INVOKER ─────────────
--
-- These two functions were flagged by Security Advisor as SECURITY DEFINER
-- callable by authenticated users. Both are read-only and have no need for
-- elevated privileges — they only query tables the caller already has RLS
-- access to. Converting to SECURITY INVOKER removes the warning and is
-- better security practice: the function runs with the caller's grants,
-- not postgres's.
--
--   listing_slots_available(uuid) — reads public.profiles (own row via RLS)
--   waypoint_within_spot(...)     — reads public.spots (public read policy)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.listing_slots_available(profile_id uuid)
returns int
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
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
$$;

create or replace function public.waypoint_within_spot(
  p_spot_id  uuid,
  p_lat      numeric,
  p_lon      numeric,
  p_radius_m int default 7000
)
returns boolean
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  hit boolean;
  pt  geography := st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography;
begin
  select exists (
    select 1 from public.spots s
    where s.id = p_spot_id
      and (
        (s.geometry is not null and st_dwithin(s.geometry, pt, 150))
        or st_dwithin(
             st_setsrid(st_makepoint(s.center_lon, s.center_lat), 4326)::geography,
             pt, p_radius_m)
      )
  ) into hit;
  return coalesce(hit, false);
end;
$$;
