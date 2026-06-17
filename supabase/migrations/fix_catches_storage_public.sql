-- Ensure catches storage bucket is public and accessible
-- Run this if catch photos show as broken on the site

-- Make sure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('catches', 'catches', true)
on conflict (id) do update set public = true;

-- Select policy: anyone can read catch photos
 drop policy if exists "Anyone can view catch photos" on storage.objects;
create policy "Anyone can view catch photos"
  on storage.objects for select using (bucket_id = 'catches');

-- Insert policy: authenticated users can upload
 drop policy if exists "Authenticated users can upload catch photos" on storage.objects;
create policy "Authenticated users can upload catch photos"
  on storage.objects for insert
  with check (bucket_id = 'catches' and auth.role() = 'authenticated');
