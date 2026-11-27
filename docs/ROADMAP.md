# UAE Anglers Hub — Product & Experience Roadmap

Date: 2026-11-27
Status: **Phase 0, Phase 1, and Phases 2A–2C are IMPLEMENTED** (2026-11-27).
Remaining: 2D (Wall of Fame + dealer spaces), Phase 3, Phase 4.
Source: Consolidated from the full project review (overview doc, codebase, `FishingMap.jsx`, `fishing_spots_import.csv`)

---

## 0. North Star

> **Innovative premium aesthetics + practical utility, so every visit feels rewarding and anglers come back daily.**

Two tests for every piece of work:

1. **Delight test** — does it look and feel like a premium product (motion, depth, polish), not a template?
2. **Utility test** — does it help an angler decide *where to go, when to go, what to use, or who to talk to*?

If a feature fails both, it doesn't ship. If it passes utility but fails delight, it ships with a polish ticket attached.

### Design language — "Deep Current" (working name)

The app already leans dark marine (`bg-slate-950`-style pages, teal accents, `KingCrown` gold). Formalize it:

- **Base**: deep-ocean dark UI (slate-950/900 gradients), never pure black
- **Primary accent**: bioluminescent teal/cyan (`teal-400` family) — actions, links, active states
- **Royal accent**: gold reserved exclusively for achievement, ranking, and premium (Hall of Fame crown, Ocean Sentinel, dealer badges)
- **Surfaces**: glass-style cards — subtle border (`white/5`), soft shadow, hover lift (2–4 px translate + shadow deepen, 150–200 ms ease-out)
- **Motion**: micro-interactions only — hover states, carousel transitions, skeleton shimmer. No gratuitous animation; everything ≤300 ms
- **Typography**: one display weight for hero numbers/titles (weights, rankings), clean body elsewhere
- **Imagery**: real spot/catch photos first, curated fallbacks second, never broken or empty frames

Deliverable: `docs/design-tokens.md` + a `lib/ui.ts` (or tailwind theme extension) so every agent builds the same look.

---

## Phase 0 — Foundation & Hygiene (Week 1) ✅ DONE

Quick wins from the review. Everything later depends on a clean base.

> Completed 2026-11-27: legacy files archived to `../_legacy/`, `npm test` added
> and green (18/18), WebSocket test fixed, README rewritten, overview doc
> regenerated, react-leaflet kept (map built in 2A). Codex's in-flight files
> were deliberately left untouched.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 0.1 | Commit or stash the ~20 modified files in the working tree | S | Includes `app/shop/*`, `app/hall-of-fame/page.tsx`, `app/api/stripe/webhook/route.ts` — **Codex is likely mid-flight here; sync first** |
| 0.2 | Delete legacy root files: `FishingMap.jsx`, `fishing_spots_import.csv`, `Fishing_Map_Implementation_Guide.docx` | S | Base44-era artifacts; the `.jsx` can't even compile in this project |
| 0.3 | Add `"test": "tsx --test tests/*.test.ts"` to `package.json`; run in CI | S | 17/18 pass today |
| 0.4 | Fix the red test (`tests/review-regressions.test.ts` — Node 20 lacks native WebSocket; use Node 22+ or `ws` transport) | S | Environment issue, not app bug |
| 0.5 | Replace boilerplate `README.md` with real setup docs (env vars, migrations, scripts) | S | `.env.local.example` already exists to reference |
| 0.6 | Decide map dependency: keep `react-leaflet` (build the map — recommended) or remove the 3 unused leaflet packages | S | See Phase 2A |
| 0.7 | Regenerate `project/UAE-Anglers-Hub-Overview.txt` from reality (Supabase not Base44, Stripe not PayPal, 45 spots not 50+) | S | It's currently marketing for a product that no longer exists |

**Exit criteria**: clean git tree, green `npm test`, no dead dependencies or legacy files, docs match the codebase.

---

## Phase 1 — Design System & Shell (Week 1–2) ✅ DONE (adapted)

The premium feel is won or lost here. Do this *before* touching the flagship surfaces so they all land on the same foundation.

> Completed 2026-11-27, **aligned to Codex's light "coastal" design system**
> discovered in-flight in `globals.css` (the dark "Deep Current" proposal was
> folded in: gold remains reserved for achievement). Delivered:
> `docs/design-tokens.md`, `components/ui/` (GlassCard, SectionHeader,
> StatBlock, Badge/PremiumBadge, EmptyState, Skeleton), and the signature
> `components/FishSplashBackdrop.tsx` canvas (water + leaping fish + splash).
> Homepage shell rebuild intentionally deferred — Codex owns `app/page.tsx`.

- 1.1 **Design tokens**: colors, spacing, radii, shadows, motion timings, typography scale (per "Deep Current" above)
- 1.2 **Core primitives**: `GlassCard`, `SectionHeader`, `StatBlock`, `Badge` (incl. gold `PremiumBadge`), `EmptyState`, `Skeleton` shimmer set
- 1.3 **Homepage shell audit**: the home page is the daily-visit surface — hero, weather widget, ad slots, featured catch, community presence should read as one composed layout, not stacked widgets
- 1.4 **Mobile-first pass**: most anglers browse from the jetty. Bottom-nav consideration, thumb-reach targets, safe-area insets

**Exit criteria**: one page (home) rebuilt on the new primitives as the reference implementation; every later surface copies its patterns.

---

## Phase 2 — The Four Flagship Surfaces (Weeks 2–6)

These are the retention engines. Order is deliberate: map first (utility anchor), then social/monetization surfaces.

### 2A. Interactive Spots Map — "Where do I go?" (Week 2–3) ✅ DONE

> Completed 2026-11-27: `/spots/map` — react-leaflet + OpenStreetMap (CSP
> updated in `next.config.ts`), dependency-free grid clustering, coastal-teal
> pins, emirate/access/species filters, "Near me" geolocation, mobile bottom
> sheet / desktop preview card linking to spot pages. Remaining from the
> original scope: spot data-quality pass, Supabase-backed spots.

The single biggest gap vs. the product vision: the overview promises clustering map views; today spot pages only link out to Google Maps (`app/spots/[slug]/page.tsx:66`).

- Full-screen `/spots/map` route using `react-leaflet` + OpenStreetMap tiles (no Google key needed, fits existing CSP in `next.config.ts`)
- Marker clustering, custom SVG pins styled to the design system (teal default, gold for top-rated)
- Filters: emirate, access type, species (port the logic from legacy `FishingMap.jsx`, with the null-safety bugs fixed)
- Bottom-sheet spot preview on mobile → links to `/spots/[slug]`; "near me" geolocation sort
- Data quality pass on the 45 spots in `lib/spots.ts`: replace `"Various"` species/bestTime/facilities values — weak data becomes weak auto-generated prose (`generateSpotDescription`, line 111)
- Longer term: move spots to Supabase so community submissions (`/spots/suggest`) go live without a code deploy

**Why it retains**: it answers the #1 pre-trip question and gives a reason to check conditions daily when paired with the weather widget.

### 2B. Chat Spaces — "Who do I talk to?" (Week 3–4) ✅ DONE (v1)

> Completed 2026-11-27: `/lounges` + `/lounges/[slug]` — 9 seeded public
> lounges (7 emirates + Today's Conditions + Catch & Brag) on the existing
> conversations/messages schema via migration
> `20261127130000_community_lounges.sql` (**must be applied to Supabase**).
> Realtime inserts, moderation redaction, hourly throttle inherited, animated
> hero. Remaining from the original scope: rich catch/spot cards in messages,
> typing indicators, lounge presence counts.

Real-time chat exists (`components/messages/`, `/api/conversations`) — elevate it from functional to *the place anglers hang out*.

- **Community lounges**: persistent public channels — one per emirate + "Today's Conditions" + "Catch & Brag" — alongside existing private/group DMs
- Rich messages: catch cards (a logged catch renders as a photo card with species/weight, tappable), spot cards, share-to-chat from spot/catch pages
- Presence & polish: `CommunityPresence.tsx` exists — surface "12 anglers online" as social proof; typing indicators, read receipts, smooth message animations
- Moderation: report flow (`ReportButton.tsx`) must cover lounge messages; blocked users (`lib/message-privacy.ts`) respected everywhere

**Why it retains**: chat is the strongest daily-return loop that exists. Emirate lounges give even lurkers a reason to open the app.

### 2C. Featured Ads Carousel — monetization that doesn't feel like ads (Week 4–5) ✅ DONE

> Completed 2026-11-27: `components/ads/FeaturedAds.tsx` (server fetch:
> paid + captured + current bookings only) + `FeaturedAdsCarousel.tsx`
> (autoplay, swipe, arrows, gold progress dots, reduced-motion aware, hides
> when no inventory). Integration pending: drop `<FeaturedAds />` into the
> homepage — `app/page.tsx` is Codex-owned. Remaining from the original
> scope: click analytics per creative, redundant-slot retirement.
>
> Addendum (2026-11-27) — **Hero sponsorship sync package**: `lib/showcase-sync.ts`
> event bus; `HeroBrandSpotlight` ("Presented by" / sponsor pitch) mounted in
> the hero left column; `FishingShowcase` broadcasts the playing clip;
> `GearCarousel` upgraded to the continuous "Tackle Ticker" (gold verified
> dealers, "From the film" lead cards synced to the playing clip).

Homepage ad infrastructure is substantial (`lib/home-advertising.ts`, `lib/ads.ts`, `BannerBiddingSection`, `HeroLeaderboardAd`, `docs/homepage-advertising.md`, `docs/ads-mobile-contract.md`). Make it feel curated, not cluttered.

- One **premium featured carousel** (hero position): full-bleed cards, autoplay with pause-on-hover, swipe on mobile, elegant progress indicators — think premium magazine, not banner farm
- Strict creative standards: enforced aspect ratios, min image quality, dark-theme-aware creatives so ads visually belong to "Deep Current"
- Clear hierarchy: 1 hero carousel + max 1 inline slot per viewport; retire redundant slot components (`AdSlotsShowcase`, `MarqueeAdSlot`, `StickyBottomAd` audit)
- Advertiser value loop: real click/impression analytics (`/api/ads/click` exists) surfaced in the vendor dashboard — premium placement must come with premium proof
- Keep AdSense as backfill only, visually subordinate to direct-sold carousel

**Why it retains (carefully)**: ads fund the platform; done premium and relevant (tackle shops, charters), they're content. Done cluttered, they kill the retention everything else builds.

### 2E. Flawless Chat + "Expeditions" (events, GPS guide) — NEW, priority

The brief: anglers chat directly, form groups, plan trips on a calendar,
get notified — and **Ocean Sentinel becomes their GPS guide to the meeting
point**. This is the premium-brand centerpiece.

**Chat hardening (make it flawless first)**
- Optimistic sends (message appears instantly, reconciles on realtime echo)
- Realtime resilience: exponential-backoff resubscribe, offline queue
- Unread badges everywhere (nav, lounge list, conversation list)
- Delivery states (sent → delivered), friendly throttle errors
- Coordinate with Codex — `app/api/conversations/**` is their active area
  (they just fixed chat realtime in 13e0614)

**Expeditions — group trip planning inside chat**
- `events` table: belongs to a conversation (group or lounge), title,
  meeting point (spot slug OR dropped pin lat/lng), starts_at/ends_at,
  created_by; `event_rsvps` (going/maybe/declined)
- "Plan a trip" composer in group chats → event card posted as a chat
  message with RSVP buttons; RSVP changes notify the organizer
- `/trips` calendar: month view + upcoming list, "my RSVPs" filter
- Notifications: invite, RSVP change, 24 h and 1 h reminders (push infra
  exists at `/api/push`)

**Ocean Sentinel GPS guide (premium hook)**
- Event page "Guide me there": live Leaflet map, user position + meeting
  pin, distance/ETA, heading
- Sentinel layer: conditions forecast *at the meeting point for trip time*
  (wind, tide, fishing score) — "Thursday looks rough, consider Saturday"
- Free users: static directions. Premium: live guide + conditions + smart
  time suggestions. This is the upsell that pays for the AI.

### 2D. Wall of Fame + Dealer Spaces — status & commerce (Week 5–6)

**Wall of Fame** (`app/hall-of-fame/page.tsx` — ⚠️ currently modified in the working tree, coordinate with Codex):

- Visual coronation: the #1 angler gets the full treatment — gold crown treatment (`KingCrown` exists), large hero card, "reign" duration, past kings timeline
- Shareable victory cards: auto-generated OG-style image per winner ("Week 48 King of the UAE — 12.4 kg Kingfish") built for WhatsApp/Instagram sharing; winners *market the app for you*
- Trophies on profiles: hall-of-fame appearances rendered as badge rows on public profiles; push notification on coronation + on being dethroned ("You were just passed — 0.3 kg to reclaim")
- Filters stay (period/metric/emirate) but get the glass-pill treatment

**Dealer Spaces** (`app/shop/*`, `components/commerce/` — ⚠️ also currently modified, coordinate):

- Verified dealer storefronts: branded header, logo, rating, response time — a *space*, not a listing list
- Dealer subscription tier (overview mentions it) → gold `Dealer` badge, carousel placement credits (ties into 2C), analytics
- Listing quality bar: multi-photo carousel (`ImageCarousel` pattern from `components/posts`), price-drop highlighting, sold-item social proof
- Trust: reviews/ratings surfaced prominently; commission transparency (2.5% in overview — verify against `lib/commerce.ts`)

**Why it retains**: status (fame) and commerce (gear) are the two strongest non-content loops; both create recurring visits.

---

## Phase 3 — Retention Loops & Polish (Week 6–8)

- 3.1 **Notification center audit**: push infra exists (`/api/push`) — build the triggers that matter: bite-score spike at a followed spot, dethroned on leaderboard, message received, bid/offer on your listing, tournament starting
- 3.2 **Daily-trip loop**: home shows "Today at your spots" — weather score + tide + recent catches nearby. One glance, one decision
- 3.3 **PWA**: overview promises installability; add manifest + service worker so the app lives on the home screen
- 3.4 **Onboarding**: first-visit → pick emirate + target species → personalized home in 30 seconds
- 3.5 **Performance**: image optimization audit, route-level loading skeletons, bundle audit after carousel/map land

## Phase 4 — Growth & Revenue Expansion (Week 8+)

- Tournaments revival (in overview, thin in code) with live leaderboards — natural tie to Wall of Fame
- Charter booking deposits via Stripe (PayPal in overview is stale — keep Stripe)
- AI assistant as a premium hook: free users taste it, Ocean Sentinel unlocks unlimited (quota plumbing already exists in `/api/assistant`)
- SEO: the spots/species static pages are an asset — keep them fast and richly structured

---

## Coordination Protocol (Codex + Kimi + others)

Multiple agents are working in this repo. To avoid collisions:

1. **Sync before touching hot files.** Currently modified (likely Codex in-flight): `app/shop/**`, `app/hall-of-fame/page.tsx`, `app/api/stripe/**`, `app/log-catch/page.tsx`, `app/species/**`, `components/*Ad*`. Check `git status` first.
2. **Branch per phase item** (`feat/map-clustering`, `feat/chat-lounges`); no direct commits to the main branch while multiple agents work.
3. **Shared contracts before parallel work**: design tokens (1.2), carousel props API, lounge channel schema — agree the interface, then build in parallel.
4. **DB changes go through `supabase/migrations/` only**, named `YYYYMMDDHHMMSS_description.sql`, matching the existing convention; run `npm test` before opening any PR.
5. **This roadmap is the source of truth for sequencing** — update it when phases complete or priorities shift.

---

## Success Metrics

| Metric | Target signal |
|---|---|
| Daily return rate | Notification + lounge + "today at your spots" drive DAU/MAU up |
| Time on `/spots/map` | Map becomes a top-3 page |
| Chat messages/user/day | Lounges outperform DMs within a month of launch |
| Ad CTR on hero carousel | ≥2× current banner slots; advertiser renewals |
| Wall of Fame shares | Victory-card shares per coronation > 0 (winners promote us) |
| Dealer subscriptions | First paying dealers within Phase 4 |
