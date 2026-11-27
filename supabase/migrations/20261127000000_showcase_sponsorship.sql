-- Upgrade the legacy banner schema without replaying historical migrations.
begin;

alter table public.ad_banner_slots
  add column if not exists slot_type text not null default 'banner';
alter table public.ad_banner_bids
  add column if not exists marquee_text text;

-- Preserve existing inventory and prices. Use the rate already defined in
-- add_advanced_ad_formats.sql only when creating the missing showcase slot.
insert into public.ad_banner_slots
  (position, label, description, slot_type, width_px, height_px, base_price_per_day, sort_order)
values
  ('home_hero_leaderboard', 'Fishing Showcase Sponsorship',
   'Banner beneath the homepage fishing showcase (970×250)',
   'banner', 970, 250, 150.00, 10)
on conflict (position) do nothing;

notify pgrst, 'reload schema';
commit;
