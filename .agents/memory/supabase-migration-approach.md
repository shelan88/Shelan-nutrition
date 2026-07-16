---
name: Supabase migration approach
description: How to run DDL migrations on Supabase from Replit — direct pg connection is blocked, Management API needs a PAT not service role key, but psql + transaction pooler works.
---

# Supabase Migration Approach from Replit

## The Problem
Three approaches **don't work** from Replit:
1. `pg` with `db.[ref].supabase.co:5432` — ENOTFOUND (blocked by Replit network)
2. Supabase Management API `/v1/projects/{ref}/database/query` — requires a Supabase personal access token (PAT), not the service role key. Returns `{"message":"JWT failed verification"}` with service role key.
3. Supabase JS client (`supabase.rpc()`) — PostgREST doesn't support DDL.

## What Works
**psql** with the **Supabase transaction pooler** (port 6543):

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  "postgresql://postgres.zioslbbneoklfmbbetfn:$SUPABASE_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  -v ON_ERROR_STOP=0 \
  -f scripts/migration.sql
```

- `psql` binary is available at `/nix/store/...replit-runtime-path.../bin/psql`
- Region for this project: `us-east-1`
- Username format for pooler: `postgres.[project-ref]` (not just `postgres`)
- Keep `-v ON_ERROR_STOP=0` to continue past non-fatal notices

**Why:** Use the pooler format with username `postgres.PROJECTREF`, not `postgres`. Direct connection hostname is blocked. Transaction pooler at port 6543 works fine.

## On CONFLICT with Partial Indexes
`ON CONFLICT (slug)` fails if the unique index is a PARTIAL index (`WHERE slug IS NOT NULL`). Fix: drop the partial index and create a full unique index:
```sql
DROP INDEX IF EXISTS services_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_idx ON services(slug);
```
Or use `ON CONFLICT DO NOTHING` without specifying the column (works only if there's a primary key conflict).

## Migration File Location
- Pure SQL migrations: `scripts/migration.sql`
- Both the original `scripts/migrate-cms.mjs` (JS with embedded SQL) and `scripts/migrate-cms-api.mjs` (Management API) are kept as reference but not used.
