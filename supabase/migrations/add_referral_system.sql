-- ============================================================
-- Add referral / invite system
-- ============================================================

-- 1. Add referral columns to profiles
alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_count int default 0;

-- 2. Update handle_new_user to track referrals
--    (works for both the simple schema.sql version and the hardened migration version)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate     text;
  suffix        text;
  tries         int := 0;
  name_source   text;
  referrer_id   uuid;
begin
  name_source := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g'));
  if candidate = '' then candidate := 'angler'; end if;

  -- Look up referrer by username passed in metadata
  select id into referrer_id
  from public.profiles
  where username = new.raw_user_meta_data->>'referred_by_username';

  loop
    begin
      insert into public.profiles (id, username, display_name, referred_by)
      values (
        new.id,
        candidate,
        coalesce(new.raw_user_meta_data->>'display_name', name_source),
        referrer_id
      );

      -- Increment referrer's count
      if referrer_id is not null then
        update public.profiles set referral_count = referral_count + 1 where id = referrer_id;
      end if;

      return new;
    exception when unique_violation then
      tries := tries + 1;
      if tries >= 6 then
        insert into public.profiles (id, username, display_name, referred_by)
        values (new.id, 'angler_' || substr(new.id::text, 1, 8), name_source, referrer_id)
        on conflict (id) do nothing;

        if referrer_id is not null then
          update public.profiles set referral_count = referral_count + 1 where id = referrer_id;
        end if;

        return new;
      end if;
      suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g')) || '_' || suffix;
    end;
  end loop;
end;
$$ language plpgsql security definer;
