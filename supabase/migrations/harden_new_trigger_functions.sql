-- ============================================================
-- Lock down trigger functions from direct public execution
--
-- These are trigger functions (called by PostgreSQL triggers, not
-- by users directly). Revoking public access silences the
-- Supabase Security Advisor warnings while keeping them fully
-- functional for their trigger callers.
--
-- IDEMPOTENT: safe to re-run. Skips functions that don't exist.
-- ============================================================

do $$
declare
  fn record;
begin
  for fn in
    select proname
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in (
        'notify_on_club_invite',
        'set_club_member_joined_at',
        'update_club_member_count',
        'update_trip_rsvp_count',
        'check_trip_full',
        'send_push_to_user',
        'on_notification_created_send_push',
        'record_ad_click',
        'record_ad_impression'
      )
  loop
    execute format(
      'revoke execute on function public.%I(%s) from public, anon, authenticated',
      fn.proname,
      (select string_agg(pg_get_function_arguments(oid), ', ')
       from pg_proc p2
       where p2.pronamespace = 'public'::regnamespace
         and p2.proname = fn.proname
       limit 1)
    );
  end loop;
end $$;
