-- ============================================================
-- UAE Anglers Hub — Google OAuth support
--
-- Updates handle_new_user to read name/avatar from Google OAuth
-- metadata (full_name, name, avatar_url) in addition to the
-- existing display_name used by email/password signups.
--
-- Supabase Google OAuth populates raw_user_meta_data with:
--   full_name, name, avatar_url, email_verified, provider_id, sub
-- ============================================================

-- ── Update profile creation trigger ─────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate text;
  suffix    text;
  tries     int := 0;
  name_source text;
  display_val text;
  avatar_val text;
begin
  -- Try display_name (email/password signup) first, then OAuth fields
  name_source := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  display_val := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    name_source
  );

  -- Capture avatar from Google OAuth if present
  avatar_val := new.raw_user_meta_data->>'avatar_url';

  candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g'));
  if candidate = '' then candidate := 'angler'; end if;

  -- Retry with a random suffix on UNIQUE(username) collisions.
  loop
    begin
      insert into public.profiles (id, username, display_name, avatar_url)
      values (
        new.id,
        candidate,
        display_val,
        avatar_val
      );
      return new;
    exception when unique_violation then
      tries := tries + 1;
      if tries >= 6 then
        insert into public.profiles (id, username, display_name, avatar_url)
        values (new.id, 'angler_' || substr(new.id::text, 1, 8), display_val, avatar_val)
        on conflict (id) do nothing;
        return new;
      end if;
      suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g')) || '_' || suffix;
    end;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger already exists on auth.users; function replacement is enough.

-- ── Backfill avatar_url for existing OAuth users ────────────
-- One-time: any profile with a null avatar but whose auth user has
-- an avatar_url in metadata gets it copied over.
update public.profiles p
set avatar_url = u.raw_user_meta_data->>'avatar_url'
from auth.users u
where p.id = u.id
  and p.avatar_url is null
  and u.raw_user_meta_data->>'avatar_url' is not null;
