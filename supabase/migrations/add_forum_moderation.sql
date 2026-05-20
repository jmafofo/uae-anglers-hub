-- ============================================================
-- UAE Anglers Hub — Forum moderation MVP
--
-- Closes the "no moderation surface" gap flagged in the review:
--   1. Users couldn't report threads/replies (no report table)
--   2. Admins had no way to hide bad content without a DDL/dashboard
--      visit (no soft-delete columns)
--
-- Design defaults (subject to product change):
--   - profiles.is_admin already exists (added in add_hall_of_fame…sql).
--     We reuse it as the admin gate.
--   - Reports are admin-visible only.
--   - 3 distinct-user reports on the same target auto-soft-delete it
--     pending admin review. Admins can dismiss the reports to restore.
--   - Soft-delete = setting deleted_at (+ deleted_by, deleted_reason).
--     Row is preserved so admins can review & potentially restore.
--
-- Privacy note: RLS continues to return soft-deleted rows so the UI
-- can render a "[removed]" tombstone (preserving reply numbering).
-- The body is masked CLIENT-SIDE for non-author/non-admin readers.
-- This is acceptable for a community fishing app where the anon key
-- is by design public; if you ever need stronger guarantees, swap to
-- a view that masks `body` at the DB layer.
-- ============================================================

-- ── 1. Soft-delete columns ─────────────────────────────────
alter table public.forum_threads
  add column if not exists deleted_at     timestamptz,
  add column if not exists deleted_by     uuid references public.profiles(id),
  add column if not exists deleted_reason text;

alter table public.forum_replies
  add column if not exists deleted_at     timestamptz,
  add column if not exists deleted_by     uuid references public.profiles(id),
  add column if not exists deleted_reason text;

create index if not exists forum_threads_deleted_ix on public.forum_threads (deleted_at) where deleted_at is not null;
create index if not exists forum_replies_deleted_ix on public.forum_replies (deleted_at) where deleted_at is not null;


-- ── 2. Moderation reports table ────────────────────────────
create table if not exists public.moderation_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  target_type     text not null check (target_type in ('thread', 'reply')),
  target_id       uuid not null,
  category        text not null check (category in ('spam', 'abuse', 'wrong_category', 'misinformation', 'other')),
  reason          text,                        -- optional free-text, max 500 chars (enforced below)
  status          text not null default 'pending'
                    check (status in ('pending', 'upheld', 'dismissed')),
  resolved_by     uuid references public.profiles(id),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  -- Each user can only report a given target once. Prevents one
  -- person spamming the auto-hide threshold by themselves.
  unique (reporter_id, target_type, target_id),
  -- Cap free-text length
  constraint moderation_reports_reason_length check (reason is null or char_length(reason) <= 500)
);

create index if not exists moderation_reports_target_ix on public.moderation_reports (target_type, target_id);
create index if not exists moderation_reports_status_ix on public.moderation_reports (status, created_at desc);

alter table public.moderation_reports enable row level security;

-- Anyone authenticated can report (one per target per user, enforced
-- by the unique constraint above).
drop policy if exists "Auth users can report" on public.moderation_reports;
create policy "Auth users can report"
  on public.moderation_reports for insert
  with check (auth.uid() = reporter_id);

-- Reporters can see their own reports; admins see everything.
drop policy if exists "Reporters and admins can read reports" on public.moderation_reports;
create policy "Reporters and admins can read reports"
  on public.moderation_reports for select
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Only admins can resolve. No DELETE policy — keep the audit trail.
drop policy if exists "Admins can resolve reports" on public.moderation_reports;
create policy "Admins can resolve reports"
  on public.moderation_reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- ── 3. Auto-hide trigger ───────────────────────────────────
-- When a target reaches AUTO_HIDE_THRESHOLD distinct reporters,
-- auto-set deleted_at on the underlying content (via service role
-- via SECURITY DEFINER). Admins can later restore by clearing
-- deleted_at.
create or replace function public.forum_auto_hide_on_reports()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  distinct_reporters int;
  threshold constant int := 3;
begin
  -- Don't act if the target is already soft-deleted by a human.
  -- (We still record the new report.)
  if new.target_type = 'thread' then
    perform 1 from public.forum_threads where id = new.target_id and deleted_at is not null;
    if found then return new; end if;
  else
    perform 1 from public.forum_replies where id = new.target_id and deleted_at is not null;
    if found then return new; end if;
  end if;

  -- Count distinct PENDING reporters (dismissed reports don't count
  -- toward future auto-hide; they were already adjudicated as fine).
  select count(distinct reporter_id) into distinct_reporters
  from public.moderation_reports
  where target_type = new.target_type
    and target_id = new.target_id
    and status = 'pending';

  if distinct_reporters >= threshold then
    if new.target_type = 'thread' then
      update public.forum_threads
        set deleted_at = now(),
            deleted_reason = 'Auto-hidden after ' || threshold || ' reports — pending admin review'
        where id = new.target_id and deleted_at is null;
    else
      update public.forum_replies
        set deleted_at = now(),
            deleted_reason = 'Auto-hidden after ' || threshold || ' reports — pending admin review'
        where id = new.target_id and deleted_at is null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists moderation_reports_auto_hide on public.moderation_reports;
create trigger moderation_reports_auto_hide
  after insert on public.moderation_reports
  for each row execute procedure public.forum_auto_hide_on_reports();


-- ── 4. Per-user report throttle ────────────────────────────
-- Stops a single user from filing 10,000 distinct-target reports
-- as spam. Mirrors the forum_throttle_threads pattern.
create or replace function public.moderation_reports_throttle()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent int;
  cap constant int := 20;
begin
  select count(*) into recent
  from public.moderation_reports
  where reporter_id = new.reporter_id
    and created_at >= now() - interval '24 hours';
  if recent >= cap then
    raise exception 'Daily report limit reached (%/day) — please contact support if you need to report more.', cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists moderation_reports_throttle_trigger on public.moderation_reports;
create trigger moderation_reports_throttle_trigger
  before insert on public.moderation_reports
  for each row execute procedure public.moderation_reports_throttle();
