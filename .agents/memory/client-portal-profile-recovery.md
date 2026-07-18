---
name: Client portal profile update and avatar upload — durable decisions
description: Root causes of profile save failures, avatar upload failures, and the fixes applied. Covers RLS, storage policies, SECURITY DEFINER RPC, and avatar display chain.
---

# Client Portal Profile — Durable Decisions

## Auto-recovery in useClientProfile
The hook calls `upsertClientFromAuth` and retries if a session exists but no `clients` row is found. Every authenticated user always has a profile — no manual DB insertion required.

**Why:** Three paths can leave a user with no `clients` row: email-confirmed signup (modal returns early), auth-state race (upsert fire-and-forget), onAuthStateChange replay before upsert settles.

## Profile save — use SECURITY DEFINER RPC, not direct table update

**Rule:** Profile updates must go through the `update_own_client_profile` SECURITY DEFINER RPC (migration 20260719000002), never via a direct `supabase.from("clients").update(...).eq("id", …).single()`.

**Why:** The direct JS update filters by `.eq("id", clientId)` while RLS adds `USING (user_id = auth.uid())`. When `.single()` is used and RLS excludes the row (any mismatch), Supabase returns a "0 rows" error silently. The SECURITY DEFINER function targets the row via `auth.uid()` inside the function body, bypassing RLS entirely and always hitting the correct row.

**How to apply:** Call `supabase.rpc("update_own_client_profile", { p_full_name, p_phone, ... })`. Pass `p_avatar_url: null` to keep the existing avatar; pass a URL string to overwrite it.

## Profile save — empty string for DATE column
`date_of_birth: ""` (empty string) sent to a PostgreSQL `DATE` column causes `invalid input syntax for type date: ""`. The RPC signature uses `DATE` type so empty string must be converted to `null` before calling.

**Fix:** In `updateOwnProfile`, convert `date_of_birth === ""` → `null` before passing to the RPC.

## Avatar upload — storage-only, no double DB write

**Rule:** `uploadAvatar` must ONLY upload to Supabase Storage and return the clean URL. It must NOT write to the `clients` table. The caller passes the URL to `updateOwnProfile` so both the file upload and the DB write happen together in one save flow.

**Why:** When `uploadAvatar` both uploaded the file AND wrote to the DB, any DB write failure caused `handleSave` to abort with an error toast before `updateOwnProfile` ran — the file was stored but the URL was never persisted, and the error path was confusing.

## Avatar URL — no cache-buster in DB, add at render time

**Rule:** Store avatar_url in the DB WITHOUT a `?t=` cache-buster. Add the cache-buster only in the `<img src>` attribute at render time.

**Why:** Storing `url?t=1234567` creates a stale immutable URL — every subsequent load uses the same buster from DB. Adding it at render time (`Date.now()`) ensures the browser always fetches the latest image after an upload.

## Storage policies required for avatar upload (migration 20260719000001)

**Required policies on `storage.objects`:**
- `auth_insert_avatars` — INSERT WHERE `name LIKE 'avatars/{uid}/%'`
- `auth_update_avatars` — UPDATE WHERE `name LIKE 'avatars/{uid}/%'`
- `auth_delete_avatars` — DELETE WHERE `name LIKE 'avatars/{uid}/%'`
- `admin_all_storage` — ALL for admin_profiles members
- `public_select_media` — SELECT for public (CDN reads)

**Without these policies, all uploads return 403 silently.**

## Navbar avatar refresh after profile save

Pattern: dispatch `window.dispatchEvent(new CustomEvent("shelan:avatar-updated"))` from ProfilePage after save; Navbar listens and immediately re-queries `clients.avatar_url`, then adds `?t=Date.now()` at render time.

## ProfilePage avatar display after save

After a successful save:
1. Set `avatarPreview` to the upload URL with `?t=Date.now()` (shows immediately without waiting for hook re-fetch)
2. Call `refresh()` — the hook re-fetches and the `useEffect([profile])` fires, calling `setAvatarPreview(null)` so the DB-backed URL takes over
3. Dispatch `shelan:avatar-updated` so the Navbar re-fetches from DB
