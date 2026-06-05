-- ============================================================
-- Part 2: Triggers and Notification Integration
-- Run this AFTER Part 1 succeeds.
-- ============================================================

-- ── 1. AUTO-UPDATE CLUB MEMBER COUNT ────────────────────────
create or replace function public.update_club_member_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    update public.clubs set member_count = member_count + 1 where id = new.club_id;
    return new;
  elsif tg_op = 'DELETE' and old.status = 'active' then
    update public.clubs set member_count = member_count - 1 where id = old.club_id;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.status != 'active' and new.status = 'active' then
      update public.clubs set member_count = member_count + 1 where id = new.club_id;
    elsif old.status = 'active' and new.status != 'active' then
      update public.clubs set member_count = member_count - 1 where id = new.club_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists club_member_count on public.club_members;
create trigger club_member_count
  after insert or delete or update on public.club_members
  for each row execute procedure public.update_club_member_count();


-- ── 2. AUTO-SET JOINED_AT ───────────────────────────────────
create or replace function public.set_club_member_joined_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'active' and old.status != 'active' then
    new.joined_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists club_member_joined on public.club_members;
create trigger club_member_joined
  before update on public.club_members
  for each row execute procedure public.set_club_member_joined_at();


-- ── 3. AUTO-UPDATE TRIP RSVP COUNT ──────────────────────────
create or replace function public.update_trip_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.status != 'declined' then
    update public.trip_posts set rsvp_count = rsvp_count + 1 where id = new.trip_post_id;
    return new;
  elsif tg_op = 'DELETE' and old.status != 'declined' then
    update public.trip_posts set rsvp_count = rsvp_count - 1 where id = old.trip_post_id;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.status = 'declined' and new.status != 'declined' then
      update public.trip_posts set rsvp_count = rsvp_count + 1 where id = new.trip_post_id;
    elsif old.status != 'declined' and new.status = 'declined' then
      update public.trip_posts set rsvp_count = rsvp_count - 1 where id = new.trip_post_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trip_rsvp_count on public.trip_rsvps;
create trigger trip_rsvp_count
  after insert or delete or update on public.trip_rsvps
  for each row execute procedure public.update_trip_rsvp_count();


-- ── 4. AUTO-MARK TRIP FULL ──────────────────────────────────
create or replace function public.check_trip_full()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tp record;
begin
  select max_participants, rsvp_count into tp
  from public.trip_posts where id = new.trip_post_id;

  if tp.max_participants is not null
     and tp.rsvp_count >= tp.max_participants
     and tp.status = 'open' then
    update public.trip_posts set status = 'full' where id = new.trip_post_id;
  elsif tp.max_participants is not null
     and tp.rsvp_count < tp.max_participants
     and tp.status = 'full' then
    update public.trip_posts set status = 'open' where id = new.trip_post_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_check_full on public.trip_rsvps;
create trigger trip_check_full
  after insert or update on public.trip_rsvps
  for each row execute procedure public.check_trip_full();


-- ── 5. NOTIFICATIONS TYPE EXPANSION ─────────────────────────
-- Safely expand the notifications type check to include club events.
-- We find and drop ALL existing check constraints on the type column,
-- then add one unified constraint.
do $$
declare
  rec record;
begin
  -- Only run if the notifications table exists
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'notifications'
  ) then
    return;
  end if;

  -- Drop every check constraint on the notifications.type column
  for rec in
    select conname
    from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%(type%'
  loop
    execute format('alter table public.notifications drop constraint if exists %I', rec.conname);
  end loop;

  -- Add the new unified check constraint
  alter table public.notifications
    add constraint notifications_type_check
    check (type in (
      'new_thread', 'new_reply', 'mention', 'catch_comment', 'new_message',
      'club_invite', 'club_join', 'trip_rsvp'
    ));
end $$;


-- ── 6. CLUB INVITE NOTIFICATION TRIGGER ─────────────────────
create or replace function public.notify_on_club_invite()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  club_name text;
  inviter_name text;
begin
  select c.name into club_name
  from public.clubs c where c.id = new.club_id;

  select p.display_name into inviter_name
  from public.profiles p where p.id = new.invited_by;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.user_id,
    'club_invite',
    'You''ve been invited to ' || coalesce(club_name, 'a club'),
    coalesce(inviter_name, 'Someone') || ' invited you to join ' || coalesce(club_name, 'a club'),
    '/clubs/' || (select slug from public.clubs where id = new.club_id)
  );

  return new;
end;
$$;

drop trigger if exists club_invite_notify on public.club_members;
create trigger club_invite_notify
  after insert on public.club_members
  for each row
  when (new.status = 'invited')
  execute procedure public.notify_on_club_invite();
