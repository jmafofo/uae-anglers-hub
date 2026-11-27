-- ============================================================
-- Re-apply the conversation_members RLS recursion fix
--
-- Background: fix_conversation_members_rls.sql (untimestamped) is
-- excluded from CI, so production never received it. Any direct
-- client query touching conversations/messages fails with:
--   42P17 infinite recursion detected in policy for relation
--   "conversation_members"
-- (Surfaced by the lounges feature, which queries via RLS from the
-- browser. DM API routes were unaffected where they use the service
-- role.)
--
-- This is a clean, idempotent re-apply of the SECURITY DEFINER
-- helper-function approach, plus the same treatment for the other
-- policies that embed conversation_members subqueries.
-- ============================================================

-- ── Helper functions (bypass RLS internally) ───────────────
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

revoke execute on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

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

-- ── conversation_members policies ──────────────────────────
drop policy if exists "Members see co-members" on public.conversation_members;
create policy "Members see co-members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "Self-join own conv or admin invite" on public.conversation_members;
create policy "Self-join own conv or admin invite"
  on public.conversation_members for insert
  with check (
    auth.uid() = user_id
    or public.is_conversation_admin(conversation_id, auth.uid())
  );

-- ── conversations policies ─────────────────────────────────
drop policy if exists "Members see own conversations" on public.conversations;
create policy "Members see own conversations"
  on public.conversations for select
  using (public.is_conversation_member(id, auth.uid()));

drop policy if exists "Group admins can rename" on public.conversations;
create policy "Group admins can rename"
  on public.conversations for update
  using (type = 'group' and public.is_conversation_admin(id, auth.uid()));

-- ── messages policies ──────────────────────────────────────
drop policy if exists "Members read messages" on public.messages;
create policy "Members read messages"
  on public.messages for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id, auth.uid())
  );

-- NOTE: the lounge policies from 20261127130000_community_lounges.sql
-- are intentionally untouched — they reference conversations directly
-- (no recursion) and are unaffected by this fix.
