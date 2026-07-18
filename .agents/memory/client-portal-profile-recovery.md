---
name: Client portal profile auto-recovery and save fixes
description: Why useClientProfile auto-creates the clients row, the save failure root cause, and storage policy requirements for avatar upload.
---

# Client Portal Profile — Durable Decisions

## Auto-recovery in useClientProfile
The hook calls `upsertClientFromAuth` and retries if a session exists but no `clients` row is found. Every authenticated user always has a profile — no manual DB insertion required.

**Why:** Three paths can leave a user with no `clients` row: email-confirmed signup (modal returns early), auth-state race (upsert fire-and-forget), onAuthStateChange replay before upsert settles.

**How to apply:** The recovery block in the hook is the primary guarantee. AuthModal also awaits the upsert to eliminate the race window.

## Profile save failure root cause — empty string for DATE column
`date_of_birth: ""` (empty string) sent to a PostgreSQL `DATE` column causes `invalid input syntax for type date: ""`. Postgres rejects it silently from the JS client — the error is returned in the `error` field, not thrown.

**Fix:** Sanitize in `profile.repository.ts` — `sanitize()` converts `date_of_birth: ""` → `null` before sending the payload. Same for `phone: ""` → `null`.

**How to apply:** Any future ProfileUpdate field with a non-TEXT Postgres column type must be sanitized from empty string to null before `.update()`.

## updateOwnProfile must return { data, error } not null
Returning `null` on failure hides the actual Postgres/RLS error from the UI. The function now returns `{ data, error: string | null }` so the page can show the real error message in the toast.

## Storage policies required for avatar upload
The `media` storage bucket needs explicit `storage.objects` policies or authenticated uploads return 403.

**Required policies (migration 20260719000001):**
- `auth_insert_avatars` — INSERT WHERE name LIKE `avatars/{uid}/%`
- `auth_update_avatars` — UPDATE WHERE name LIKE `avatars/{uid}/%`  
- `auth_delete_avatars` — DELETE WHERE name LIKE `avatars/{uid}/%`
- `admin_all_storage` — ALL for admin_profiles members
- `public_select_media` — SELECT for public (CDN reads)

## Navbar avatar refresh after profile save
Navbar fetches `avatar_url` only on `onAuthStateChange` — not on profile updates. Pattern: dispatch `window.dispatchEvent(new CustomEvent("shelan:avatar-updated"))` from ProfilePage after save; Navbar listens with `window.addEventListener("shelan:avatar-updated", handler)` to re-fetch from `clients` table.

## ProfilePage loading gate
`if (loading || (!profile && !error))` — stays on spinner during auto-recovery. Falls through to error state only after a confirmed DB error.
