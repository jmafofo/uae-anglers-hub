-- ============================================================
-- Fix RLS infinite recursion on conversation_members
--
-- The original "Members see co-members" SELECT policy queried
-- conversation_members from within its own USING clause. This
-- caused infinite recursion because evaluating the policy
-- required evaluating the same policy on the inner query.
--
-- Fix: Replace recursive EXISTS subqueries with SECURITY DEFINER
-- helper functions. When called from within a policy, these
-- functions bypass RLS for their internal queries, breaking the
-- recursion chain.
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================

-- ── Helper 1: check membership ──────────────────────────────
create or replace function public.is_conversation_member(
  p_conv_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conv_id and user_id = p_user_id
  );
$$;

-- Lock down: only the postgres role (and hence policies) needs this
revoke execute on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

-- ── Helper 2: check admin role ──────────────────────────────
create or replace function public.is_conversation_admin(
  p_conv_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conv_id
      and user_id = p_user_id
      and role = 'admin'
  );
$$;

revoke execute on function public.is_conversation_admin(uuid, uuid) from public;
grant execute on function public.is_conversation_admin(uuid, uuid) to authenticated;

-- ── Fix conversation_members SELECT policy ──────────────────
drop policy if exists "Members see co-members" on public.conversation_members;
create policy "Members see co-members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

-- ── Fix conversation_members INSERT policy ──────────────────
-- Was recursive because it queried conversation_members for admin rows.
drop policy if exists "Self-join own conv or admin invite" on public.conversation_members;
create policy "Self-join own conv or admin invite"
  on public.conversation_members for insert
  with check (
    auth.uid() = user_id
    or public.is_conversation_admin(conversation_id, auth.uid())
  );

-- ── Fix messages SELECT policy ──────────────────────────────
-- Also recursive because it queried conversation_members.
drop policy if exists "Members read messages" on public.messages;
create policy "Members read messages"
  on public.messages for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

-- NOTE: messages INSERT, UPDATE, DELETE policies are NOT recursive
-- because they only check auth.uid() = sender_id (no self-query).
-- conversations policies are also NOT recursive — they query
-- conversation_members from a *different* table's policy, which
-- is fine now that conversation_members has a non-recursive policy.
