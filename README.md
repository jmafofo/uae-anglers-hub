# UAE Anglers Hub

The UAE's shore-fishing community platform — spots, catches, species ID, AI assistant, chat, marketplace, charters, and tournaments across all seven Emirates.

Live: https://uaeangler.com

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + TypeScript
- **Supabase** — Postgres, Auth (PKCE), RLS, Realtime, Storage
- **Stripe** — subscriptions, ad-slot bidding, marketplace & charter payments
- **Anthropic Claude** — fish identification (vision) and the AI fishing assistant
- **Open-Meteo** — weather data (no key required)
- **Tailwind CSS 4**, **Leaflet/react-leaflet** (maps), **Resend** (email), **zod** (validation)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev                        # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project URL + anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — bypasses RLS. Never expose to the client |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | Stripe keys |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` / dashboard webhook |
| `ANTHROPIC_API_KEY` | Claude for `/api/identify` and `/api/assistant` (add this — it's missing from the example file) |
| `RESEND_API_KEY` | Transactional email |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` in dev |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in |
| `NEXT_PUBLIC_GOOGLE_ADS_CLIENT` / `NEXT_PUBLIC_GOOGLE_ADS_SLOT_HOME` | AdSense backfill |
| `PUSH_WEBHOOK_SECRET` | Push notification webhook auth |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (`tsx --test tests/*.test.ts`) — requires Node 20+, all tests should pass |
| `npm run lint` | ESLint |
| `npm run fetch-photos` | Fetch Google Places photos for spots (needs API key) |
| `npm run scan-photos` / `scan-species-photos` | Index local photo assets into `lib/*.json` |

## Database

Migrations live in `supabase/migrations/` and run in CI on merge (see `supabase/MIGRATIONS.md`).
New migrations must be named `YYYYMMDDHHMMSS_description.sql` and are applied with the service role — write them idempotently (`create ... if not exists`, `drop policy if exists` before `create policy`).

## Project layout

- `app/` — routes (App Router). API routes in `app/api/**` use `lib/api-auth.ts` (`requireAuth` / `requireAuthUniversal`)
- `components/` — shared UI, `components/messages/`, `components/posts/`, `components/commerce/`, `components/ui/` (design-system primitives)
- `lib/` — domain logic. `lib/supabase.ts` (browser client), `lib/supabase-admin.ts` (server-only, service role)
- `tests/` — `node:test` suites run via tsx
- `docs/` — product/design docs, including `docs/ROADMAP.md`

## Conventions & coordination

- **Multiple AI agents work in this repo.** Check `git status` before editing files someone else has modified; work on a branch per feature; agree contracts (schemas, component APIs) before parallel work.
- Heed `AGENTS.md`: this is a newer Next.js than training data — check `node_modules/next/dist/docs/` before using Next APIs.
- Server-side service-role usage stays in `app/api/**` and `lib/*-admin.ts`, never in client components.
- Run `npm test` and `npx tsc --noEmit` before considering work done.
