-- ============================================================
-- UAE Anglers Hub — explicit admin-read policy on stripe_events
--
-- Silences the "RLS Enabled No Policy" advisor info on
-- public.stripe_events. The table is written only by the
-- webhook via service role (which bypasses RLS), so denying
-- every other role is correct — but the advisor wants the
-- intent expressed as a policy rather than implied by its
-- absence. Also useful: admins can inspect webhook deliveries
-- without a service-role key.
-- ============================================================

create policy "Admins read stripe events"
  on public.stripe_events for select
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));
