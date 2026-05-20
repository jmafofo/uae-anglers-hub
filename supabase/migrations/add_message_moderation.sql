-- ============================================================
-- Message content moderation
--
-- Adds moderation status tracking and automatic flagging for
-- inappropriate content in chat messages.
-- ============================================================

-- 1. Add moderation status to messages
alter table public.messages
  add column if not exists moderation_status text not null default 'approved'
  check (moderation_status in ('approved', 'flagged', 'removed'));

-- 2. Keyword table for content filtering
--    Admins can add/remove keywords without code changes.
create table if not exists public.moderation_keywords (
  id         serial primary key,
  keyword    text not null unique,
  category   text not null default 'profanity',
  severity   text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

-- Seed a starter set of English profanity / explicit terms.
-- This is an MVP list; admins should expand it via the dashboard.
insert into public.moderation_keywords (keyword, category, severity) values
  ('fuck',   'profanity', 'medium'),
  ('shit',   'profanity', 'low'),
  ('bitch',  'profanity', 'medium'),
  ('asshole','profanity', 'medium'),
  ('cunt',   'profanity', 'high'),
  ('dick',   'profanity', 'medium'),
  ('porn',   'sexual',    'high'),
  ('xxx',    'sexual',    'high'),
  ('nude',   'sexual',    'high'),
  ('sex',    'sexual',    'medium'),
  ('nigger', 'hate',      'high'),
  ('faggot', 'hate',      'high')
on conflict (keyword) do nothing;

-- 3. Moderation trigger: flags messages containing any keyword
--    Uses word-boundary regex so "Sussex" won't match "sex".
create or replace function public.messages_moderate()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  bad_word text;
begin
  select mk.keyword into bad_word
  from public.moderation_keywords mk
  where new.body ~* ('\y' || mk.keyword || '\y')
  limit 1;

  if found then
    new.moderation_status := 'flagged';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_moderate_trigger on public.messages;
create trigger messages_moderate_trigger
  before insert on public.messages
  for each row execute procedure public.messages_moderate();
