# Database migrations

New production migrations must be created in `supabase/migrations` using:

```text
YYYYMMDDHHMMSS_descriptive_name.sql
```

Files without a 14-digit timestamp predate automated deployment. They are retained
as historical references and are deliberately excluded from CI so they cannot be
replayed against production.

On pull requests, the workflow validates tracked filenames and rejects edits or
deletions of existing timestamped migrations. On pushes to `main`, it previews and
then applies pending migrations using the Supabase CLI migration history table.

Configure the `SUPABASE_DB_URL` secret in the GitHub `production` environment or as
a repository Actions secret. Use the production **Session Pooler** connection URI
from Supabase Dashboard → Connect, with the password URL-encoded.

For the atomic Stripe fulfillment change, apply
`20261126000000_atomic_stripe_fulfillment.sql` before deploying the webhook that
calls `fulfill_stripe_event`. If the function is unavailable, the webhook returns
500 so Stripe can retry. The RPC is executable only by `service_role` and commits
the event record and fulfillment writes in the same transaction.

Existing `stripe_events` rows remain deduplicated. This migration cannot determine
which historical events failed after being recorded by the old handler. Reconcile
suspected missing purchases against Stripe and the purchase/profile records before
replaying them; do not bulk-delete event records. Banner notification email remains
best effort after fulfillment commits.

Regression checks:

- `node --experimental-websocket --import tsx --test tests/review-regressions.test.ts`
  (the WebSocket flag is for Node 20; Node 22+ provides it by default).
- Run `psql -v ON_ERROR_STOP=1 -f tests/stripe-fulfillment.sql` only against an empty,
  disposable database. It creates fixture tables and roles, injects a write
  failure, verifies rollback and retry deduplication, and checks fulfillment branches.

- 2026-11-27: Applied `20261127010000_film_brand_placements.sql` through the project SQL editor; success verified. Adds admin-managed creator/brand associations.
