-- ============================================================
-- UAE Anglers Hub — get_or_create_dm enforces dm_policy
--
-- Extends the existing RPC to honour profiles.dm_policy:
--
--   open           → anyone signed-in (unchanged)
--   followers_only → caller must be in recipient's `follows`
--                    (recipient follows the caller)
--   closed         → nobody — RPC raises
--
-- Block list precedence stays the same: a block trumps even an
-- open dm_policy.
-- ============================================================

create or replace function public.get_or_create_dm(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid;
  conv_id uuid;
  other_policy text;
begin
  me := auth.uid();
  if me is null then
    raise exception 'auth required';
  end if;
  if me = p_other_user_id then
    raise exception 'cannot DM yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'recipient not found';
  end if;
  if exists (
    select 1 from public.blocked_users
    where blocker_id = p_other_user_id and blocked_id = me
  ) then
    raise exception 'recipient does not accept messages from you';
  end if;

  -- dm_policy enforcement
  select dm_policy into other_policy from public.profiles where id = p_other_user_id;
  if other_policy = 'closed' then
    raise exception 'recipient is not accepting direct messages';
  elsif other_policy = 'followers_only' then
    -- Caller must be followed BY the recipient. The semantic
    -- choice: "you can DM me if I follow you" — recipient opts
    -- in to who can reach them, mirroring Twitter/X-style DM gating.
    if not exists (
      select 1 from public.follows
      where follower_id = p_other_user_id and following_id = me
    ) then
      raise exception 'recipient only accepts DMs from anglers they follow';
    end if;
  end if;

  -- Look for an existing DM with exactly these two members.
  select c.id into conv_id
  from public.conversations c
  where c.type = 'dm'
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = me)
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = p_other_user_id)
  limit 1;
  if found then
    return conv_id;
  end if;

  -- Create new
  insert into public.conversations (type, created_by) values ('dm', me) returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id) values (conv_id, me);
  insert into public.conversation_members (conversation_id, user_id) values (conv_id, p_other_user_id);
  return conv_id;
end;
$$;

-- Re-assert grants (CREATE OR REPLACE resets them in some PG versions).
revoke execute on function public.get_or_create_dm(uuid) from public;
revoke execute on function public.get_or_create_dm(uuid) from anon;
grant  execute on function public.get_or_create_dm(uuid) to   authenticated;
