-- ============================================================
-- Retention triggers — support tables for the /api/cron/retention
-- job (expedition reminders + crown watch).
--
-- 1. Expands the notifications type constraint for the new kinds.
-- 2. notification_log — dedupe so each user gets each trigger once.
-- 3. app_state — tiny KV for cron cursors (e.g. current king).
-- Both new tables are service-role only (no client policies).
-- ============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('new_thread', 'new_reply', 'mention',
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
