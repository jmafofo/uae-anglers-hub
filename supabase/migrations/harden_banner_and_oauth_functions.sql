-- ============================================================
-- UAE Anglers Hub — Security hardening for new banner/OAuth functions
--
-- Addresses Security Advisor warnings:
--   1. Function Search Path Mutable on get_active_banner,
--      expire_old_banner_bids, and the updated handle_new_user
--   2. Public / signed-in users can execute SECURITY DEFINER
--      functions that should be trigger- or service-role only
--   3. moderation_keywords has RLS enabled but no policies
-- ============================================================

-- ── 1. Fix search_path on banner functions ──────────────────

alter function public.get_active_banner(text)
  set search_path = '';

alter function public.expire_old_banner_bids()
  set search_path = '';

-- ── 2. Fix search_path on the updated handle_new_user ───────

alter function public.handle_new_user()
  set search_path = '';

-- ── 3. Lock down SECURITY DEFINER functions ─────────────────

-- get_active_banner is called only by the Next.js server via
-- service_role.  Anonymous visitors never hit it directly.
revoke execute on function public.get_active_banner(text) from public;

-- expire_old_banner_bids is a trigger-only function
revoke execute on function public.expire_old_banner_bids() from public;

-- messages_moderate is a trigger-only function (already flagged)
revoke execute on function public.messages_moderate() from public;

-- ── 4. moderation_keywords RLS policy ───────────────────────

-- The table is read by the messages_moderate trigger (which runs
-- as SECURITY DEFINER, so it bypasses RLS) and by admins who
-- manage the keyword list.  Public / signed-in users have no
-- legitimate reason to read it directly, but the advisor wants
-- an explicit policy rather than leaving it as implicit-deny.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moderation_keywords' and policyname = 'Admin-only read moderation_keywords'
  ) then
    create policy "Admin-only read moderation_keywords"
      on public.moderation_keywords for select
      using (exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin = true
      ));
  end if;
end $$;
