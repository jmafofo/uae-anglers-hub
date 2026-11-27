-- ============================================================
-- Completes 20261127160000_retention_triggers.sql, which failed
-- on re-adding the notifications type check: production rows use
-- 'new_message' (DM system), a type missing from the expanded list.
-- The failed run left the constraint dropped; this re-adds it
-- correctly and creates the support tables.
-- ============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('new_thread', 'new_reply', 'new_message', 'mention',
                  'event_reminder', 'crown_crowned', 'crown_dethroned'));

create table if not exists public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  ref_id     text not null,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kind, ref_id, user_id)
);
alter table public.notification_log enable row level security;

create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
