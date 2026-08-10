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
