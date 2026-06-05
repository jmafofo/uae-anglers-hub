-- Add support for multiple catch photos
alter table public.catches add column if not exists photo_urls text[];
