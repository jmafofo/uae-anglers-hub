-- Track one post view per viewer per UTC calendar day instead of one forever.
alter table public.post_views
  add column if not exists viewed_on date;

update public.post_views
set viewed_on = timezone('utc', created_at)::date
where viewed_on is null;

alter table public.post_views
  alter column viewed_on set default (timezone('utc', now())::date),
  alter column viewed_on set not null;

alter table public.post_views
  drop constraint if exists post_views_post_id_viewer_id_key,
  drop constraint if exists post_views_post_id_ip_hash_key;

create unique index if not exists post_views_user_daily_key
  on public.post_views (post_id, viewer_id, viewed_on)
  where viewer_id is not null;

create unique index if not exists post_views_ip_daily_key
  on public.post_views (post_id, ip_hash, viewed_on)
  where ip_hash is not null;

alter table public.post_views
  drop constraint if exists post_views_has_viewer_check;

alter table public.post_views
  add constraint post_views_has_viewer_check
  check (num_nonnulls(viewer_id, ip_hash) = 1) not valid;
