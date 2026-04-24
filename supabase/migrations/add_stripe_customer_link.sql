-- ============================================================
-- UAE Anglers Hub — Stripe customer linking
--
-- Binds a Supabase profile to a single Stripe Customer so that
-- cancel → resubscribe, multiple product purchases, and refunds
-- all land on the same billing record. Without this, each
-- checkout.sessions.create() with a customer_email creates a
-- fresh Stripe Customer and the history fragments.
-- ============================================================

alter table public.profiles
  add column if not exists stripe_customer_id text;

-- Partial unique index — allows many profiles with no Stripe
-- customer yet, but forbids two profiles pointing at the same
-- Stripe customer.
create unique index if not exists profiles_stripe_customer_id_uq
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Tighten the self-service update policy so users can't set
-- their own stripe_customer_id via the anon client. The webhook
-- uses the service role and bypasses RLS.
drop policy if exists "Users update own profile without elevating" on public.profiles;
create policy "Users update own profile without elevating"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
    and stripe_customer_id is not distinct from
        (select p.stripe_customer_id from public.profiles p where p.id = auth.uid())
  );
