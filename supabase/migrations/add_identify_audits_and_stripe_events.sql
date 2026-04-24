-- ============================================================
-- UAE Anglers Hub — Stripe idempotency + Identify audit trail
--
-- Closes three gaps flagged in the subscription/identify review:
--   1. Webhook retries can double-apply slot/boost grants (no idempotency)
--   2. /api/identify has no premium gate (revenue leak)
--   3. Identify → catch link is manual, species can be spoofed
-- ============================================================

-- ── Stripe webhook idempotency ──────────────────────────────
-- Webhook handler inserts the event_id at the top of every
-- request. Re-deliveries trip the PK and skip the side effects.
create table if not exists public.stripe_events (
  event_id     text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Service role only — no policies needed, RLS denies all client access.

-- ── Identify audit trail ────────────────────────────────────
-- Every /api/identify call inserts a row. The audit is the
-- authoritative source of species/confidence/GPS when a catch
-- is later created — clients can't spoof values they didn't
-- actually receive from Claude.
create table if not exists public.identify_audits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade,
  status           text not null check (status in ('identified','unnamed','error')),
  species          text,
  scientific_name  text,
  confidence_pct   numeric(4,3),
  candidates       jsonb,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  image_url        text,
  created_at       timestamptz not null default now(),
  -- Audit is redeemable on a catch only within 24h of identification.
  expires_at       timestamptz not null default (now() + interval '24 hours')
);

create index if not exists identify_audits_user_ix on public.identify_audits (user_id, created_at desc);
create index if not exists identify_audits_expires_ix on public.identify_audits (expires_at);

alter table public.identify_audits enable row level security;

create policy "Users read own identify audits"
  on public.identify_audits for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE policies — only the service role (via the
-- identify route) writes to this table. This prevents users
-- from forging an audit row to later redeem on a catch.

-- ── Link catches back to the identify audit ─────────────────
alter table public.catches
  add column if not exists identify_id     uuid references public.identify_audits(id),
  add column if not exists identify_confidence numeric(4,3);

create index if not exists catches_identify_id_ix on public.catches (identify_id);

-- ── Helper: per-day identify quota for a user ───────────────
-- Premium users bypass this — the endpoint short-circuits.
-- Free users are capped; the helper returns today's count so
-- the endpoint can decide whether to allow one more call.
create or replace function public.identify_count_today(p_user_id uuid)
returns int language sql stable as $$
  select count(*)::int
  from public.identify_audits
  where user_id = p_user_id
    and created_at >= date_trunc('day', now());
$$;

grant execute on function public.identify_count_today(uuid) to authenticated;
