-- ============================================================
-- UAE Anglers Hub — AI Assistant usage ledger
--
-- Replaces the route's instance-local in-memory rate limiter
-- with a durable per-user daily counter. Mirrors the identify
-- pattern (identify_audits + identify_count_today) so the two
-- AI features share conventions.
--
-- Free anglers get FREE_ASSISTANT_PER_DAY turns/day; Ocean
-- Sentinel premium subscribers bypass the cap. The route reads
-- profiles.ocean_sentinel_premium to decide.
-- ============================================================

-- ── Usage ledger ────────────────────────────────────────────
-- One row per /api/assistant turn that successfully reached
-- Anthropic. Audit / billing / abuse forensics live here.
create table if not exists public.assistant_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  prompt_chars    int,
  response_chars  int
);

create index if not exists assistant_usage_user_day_ix
  on public.assistant_usage (user_id, created_at desc);

alter table public.assistant_usage enable row level security;

-- Users can read their own ledger (lets the app surface "X/100
-- assistant messages used today" if we want it later).
drop policy if exists "Users read own assistant usage" on public.assistant_usage;
create policy "Users read own assistant usage"
  on public.assistant_usage for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies — only the service role
-- (via the assistant route) writes. Mirrors identify_audits.

-- ── Helper: today's turn count for a user ───────────────────
create or replace function public.assistant_count_today(p_user_id uuid)
returns int
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select count(*)::int
  from public.assistant_usage
  where user_id = p_user_id
    and created_at >= date_trunc('day', now());
$$;

grant execute on function public.assistant_count_today(uuid) to authenticated;
