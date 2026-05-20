-- ============================================================
-- Add DM / message notifications
-- ============================================================

-- 1. Expand notification type check to include new_message
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('new_thread', 'new_reply', 'mention', 'catch_comment', 'new_message'));

-- 2. Add conversation_id column for deep-linking to DMs
alter table public.notifications
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

-- 3. Trigger: notify conversation members on new message
--    (skip self — the sender doesn't need a notification for their own message)
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, type, title, body, link, conversation_id)
  select
    cm.user_id,
    'new_message',
    coalesce((select display_name from public.profiles where id = new.sender_id), 'Someone') || ' sent you a message',
    left(new.body, 120),
    '/community/messages?c=' || new.conversation_id,
    new.conversation_id
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id != new.sender_id;

  return new;
end;
$$;

create or replace trigger messages_notify
  after insert on public.messages
  for each row execute procedure public.notify_on_new_message();
