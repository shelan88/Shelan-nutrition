---
name: Delete Account — permanent server-side flow
description: Architecture for the client portal "Delete Account" feature; service_role key is server-only.
---

## Rule
Never delete a Supabase Auth user from the browser. The `SUPABASE_SERVICE_ROLE_KEY` lives exclusively in `api/server.js`; the browser calls `POST /api/delete-account` with its own JWT.

## How it works
1. `api/server.js` — Express server on port 3001, started via `concurrently` alongside Vite.
2. Vite proxies `/api → http://localhost:3001` (vite.config.ts server.proxy).
3. `npm run dev` = `concurrently "node api/server.js" "vite"`.
4. Endpoint verifies caller JWT via `anonClient.auth.getUser(token)`, then uses `adminClient` (service_role) to:
   - UPDATE clients SET status='Inactive', deleted_at=now(), user_id=NULL WHERE user_id=uid
   - auth.admin.deleteUser(uid) — permanently disables login
5. Client (`deleteAccount()` in profile.repository.ts) calls `/api/delete-account` with `Authorization: Bearer <access_token>`, then calls `supabase.auth.signOut()` locally on 200.

## Migration
`20260725000002_client_deleted_at.sql` — adds `deleted_at TIMESTAMPTZ` to clients table. Applied.

## Node.js 20 WebSocket requirement
`@supabase/supabase-js` on Node 20 requires `ws` passed as `realtime: { transport: ws }` when creating clients server-side. Both `anonClient` and `adminClient` in `api/server.js` do this. Trace scripts (.cjs) do the same.

**Why:** Node 20 has no native WebSocket; supabase-js throws at construction time without the transport option. Node 22+ doesn't need it.

## Archival guarantees
- Client row: stays in DB forever, visible to admin dashboard (status=Inactive, deleted_at set, user_id=NULL)
- Auth user: hard-deleted → `signInWithPassword` returns "Invalid login credentials" immediately
- Only admins can hard-delete the client row from the database
