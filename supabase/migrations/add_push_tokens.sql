-- ============================================================
-- UAE Anglers Hub — Push Notification Infrastructure
--
-- 1. Enables pg_net extension for async HTTP from triggers.
-- 2. Creates push_tokens table to store Expo push tokens.
-- 3. Adds a trigger on public.notifications that fires a
--    webhook (via pg_net) to /api/push/deliver whenever a
--    notification row is inserted.
--
-- Setup required after migration:
--   INSERT INTO public.app_config (key, value) VALUES
--     ('push_webhook_url', 'https://<your-domain>/api/push/deliver'),
--     ('push_webhook_secret', '<same-as-PUSH_WEBHOOK_SECRET-env>')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- ============================================================

-- 1. pg_net extension (required for HTTP calls from PostgreSQL)
create extension if not exists pg_net;

-- 2. Push tokens table
-- Each row links one Expo push token to a user. Tokens are
-- deduplicated globally so a device always maps to one user.
create table if not exists public.push_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  expo_push_token text not null unique,
  platform        text,                               -- 'ios' | 'android'
  created_at      timestamptz default now()
);

create index if not exists push_tokens_user_ix
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Users can insert own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

create policy "Users can view own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);


-- 3. App config table (no-privilege alternative to ALTER DATABASE SET)
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

-- 4. Helper: send_push_to_user
-- Fire-and-forget HTTP POST to the app's push delivery webhook.
-- The webhook (Next.js API route) looks up tokens and calls Expo.
create or replace function public.send_push_to_user(
  target_user_id uuid,
  p_title        text,
  p_body         text,
  p_data         jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  webhook_url text;
  secret      text;
begin
  -- Skip users with no registered tokens
  if not exists (
    select 1 from public.push_tokens where user_id = target_user_id
  ) then
    return;
  end if;

  select value into webhook_url from public.app_config where key = 'push_webhook_url';
  select value into secret      from public.app_config where key = 'push_webhook_secret';

  if webhook_url is null or webhook_url = '' then
    return;
  end if;

  perform net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object(
      'Content-Type',          'application/json',
      'X-Push-Webhook-Secret', coalesce(secret, '')
    ),
    body    := jsonb_build_object(
      'userId', target_user_id,
      'title',  p_title,
      'body',   p_body,
      'data',   p_data
    )
  );
end;
$$;


-- 4. Trigger: on every new notification row, also send a push
create or replace function public.on_notification_created_send_push()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.send_push_to_user(
    new.user_id,
    new.title,
    left(new.body, 140),
    jsonb_build_object(
      'type',           new.type,
      'link',           new.link,
      'threadId',       new.thread_id,
      'catchId',        new.catch_id,
      'conversationId', new.conversation_id,
      'notificationId', new.id
    )
  );
  return new;
end;
$$;

drop trigger if exists notification_created_push on public.notifications;
create trigger notification_created_push
  after insert on public.notifications
  for each row execute procedure public.on_notification_created_send_push();
