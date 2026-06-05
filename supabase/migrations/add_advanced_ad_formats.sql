-- ============================================================
-- UAE Anglers Hub — Advanced Ad Formats ("Badders")
--
-- Adds new high-impact ad positions:
--   • Sticky Bottom Banner    — fixed to viewport bottom
--   • Content Inline          — medium rectangle between content
--   • Hero Leaderboard        — large banner below hero section
--   • Modal Overlay           — popup modal, session-aware
--   • Interstitial            — full-screen between navigations
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================

-- ── Expand slot_type enum ───────────────────────────────────
-- Drop and recreate the check constraint to include new formats
alter table public.ad_banner_slots drop constraint if exists ad_banner_slots_slot_type_check;
alter table public.ad_banner_slots add constraint ad_banner_slots_slot_type_check
  check (slot_type in ('banner', 'marquee', 'sticky', 'inline', 'modal', 'interstitial'));

-- ── Add new advanced slots ──────────────────────────────────
insert into public.ad_banner_slots (position, label, description, slot_type, width_px, height_px, base_price_per_day, sort_order)
values
  ('home_hero_leaderboard', 'Homepage Hero Leaderboard',  'Large rich-media banner below the homepage hero section (970×250)',       'banner',        970, 250, 150.00, 10),
  ('home_inline_1',         'Homepage Inline Content 1',  'Medium rectangle between Trending News and Data Gap sections',           'inline',        300, 250, 80.00,  11),
  ('home_inline_2',         'Homepage Inline Content 2',  'Medium rectangle between Platform Features and Species Showcase',        'inline',        300, 250, 80.00,  12),
  ('sticky_bottom',         'Sticky Bottom Banner',       'Fixed bottom banner visible on all pages (728×90)',                      'sticky',        728, 90,  120.00, 13),
  ('home_modal',            'Homepage Modal',             'Modal popup on homepage — shows once per visitor session',               'modal',         600, 400, 200.00, 14),
  ('interstitial',          'Site Interstitial',          'Full-screen overlay between page navigations — shows once per session',  'interstitial',  1080, 720, 300.00, 15)
on conflict (position) do update set
  label = excluded.label,
  description = excluded.description,
  slot_type = excluded.slot_type,
  width_px = excluded.width_px,
  height_px = excluded.height_px,
  base_price_per_day = excluded.base_price_per_day,
  sort_order = excluded.sort_order;

-- ── Ensure all slots are active ─────────────────────────────
update public.ad_banner_slots set is_active = true
  where position in (
    'home_hero_leaderboard', 'home_inline_1', 'home_inline_2',
    'sticky_bottom', 'home_modal', 'interstitial'
  );
