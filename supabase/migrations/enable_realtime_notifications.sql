-- ============================================================
-- UAE Anglers Hub — Enable Realtime for notifications
--
-- The NotificationsDropdown component now subscribes to live
-- changes on `public.notifications` instead of polling every
-- 30s. Supabase Realtime only broadcasts changes for tables
-- explicitly added to the `supabase_realtime` publication, so
-- this migration toggles that on.
--
-- RLS still applies — the channel filter `user_id=eq.<viewer>`
-- combined with the existing "Users can view own notifications"
-- policy means each subscriber only receives their own rows.
-- ============================================================

-- Guard against the publication not existing on a fresh project
-- (Supabase auto-creates it, but this is belt-and-braces).
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

-- Add notifications to the publication (idempotent — won't error
-- if it's already there).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
