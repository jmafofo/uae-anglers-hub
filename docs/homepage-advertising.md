# Homepage advertising

The hero uses a film partner strip above the player and a full-width product carousel beneath the hero. No sample brands or merchandise are presented as paid inventory.

## Eligibility

Both placements require an approved `home_hero_leaderboard` booking, an active slot, `stripe_capture_status = captured`, a payment intent, and a current start/end window. An authorization alone is insufficient. Refunded, cancelled, future, expired and missing-payment records fail closed.

The carousel reads available, unsold marketplace listings owned by qualifying advertiser accounts. Listings must have a positive numeric price and HTTPS product photo. At most three products per dealer and twelve overall are displayed. Listings link to their marketplace detail page. The carousel pauses on hover, keyboard focus, touch and hidden tabs; reduced-motion users get manual navigation.

## Film brand associations

`supabase/migrations/20261127010000_film_brand_placements.sql` was applied to production on 2026-11-27 (Supabase returned success). Admins curate `film_brand_placements` with the YouTube video ID, advertiser profile ID, actual brand name, logo and destination. Confirm the creator/brand association before marking it active. A paid booking alone never implies a brand is associated with a film. The strip follows the selected film. Until associations exist, it credits the creator and offers a partner enquiry link.

## Operations

Advertisers create their products through `/shop/create` and book via `/advertise#banner-bids`. Existing admin banner approval and Stripe capture flows activate their booking. Existing banner creative remains available in its original component for other placements. No new prices or Stripe accounts are created by this change.

Production Stripe activation is still required before accepting live payments. A successful checkout authorization is not a captured payment. Empty inventory renders a partner invitation, not invented stock or performance claims.
