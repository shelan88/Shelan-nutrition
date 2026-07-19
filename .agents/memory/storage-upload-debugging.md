---
name: Storage upload debugging
description: Pitfalls when debugging Supabase Storage uploads — why node/service-role tests pass but real browser uploads fail.
---

# Storage Upload Debugging — Key Lessons

## Service-role tests are not browser-upload tests
The node verification scripts (`scripts/verify-uploads.mjs`) use the Supabase **service role key**, which bypasses ALL row-level security and ALL bucket limits. A 73/73 pass rate from that script proves only that the storage bucket and tables exist and are reachable — it says nothing about whether a real authenticated browser user can upload.

**Why:** RLS policies, bucket `file_size_limit`, and JWT validity are only enforced when using the anon key + user JWT.

**How to apply:** After any upload-architecture change, test with a real logged-in admin session in the browser. Watch the browser console for the actual Supabase error message.

## Bucket `file_size_limit` is enforced server-side
The `storage.buckets` row has a `file_size_limit` column (bytes). Supabase rejects uploads over this limit with HTTP 413 before RLS even runs. The JS client's `maxSizeMb` option is client-side validation only.

**Why:** Client-side size check in `uploadToStorage` passed 50 MB; bucket was set to 10 MB. Any photo over 10 MB silently returned "Upload failed".

**How to apply:** Keep `file_size_limit` in the bucket migration in sync with `maxSizeMb` in `uploadToStorage`. Current state: both are 50 MB.

## `admin_all_storage` policy — use SECURITY DEFINER
The original policy used a plain `EXISTS` subquery on `admin_profiles`. Because `admin_profiles` has its own RLS, this subquery is filtered by `user_id = auth.uid()` — which should return the user's own row. In practice this was fragile: if the subquery runs in a context where `auth.uid()` is evaluated differently, it silently returns 0 rows and the policy denies the upload.

**Fix applied:** Created `public.is_shelan_admin()` as a `SECURITY DEFINER STABLE` function. The function runs as the owner (bypasses admin_profiles RLS) and returns a boolean. The policy calls the function.

**How to apply:** Any storage policy that checks a user-data table (admin_profiles, client_profiles, etc.) should use a SECURITY DEFINER helper function rather than an inline subquery.

## Error propagation — repositories must throw, not return null
When `uploadToStorage` returns `{ url: null, error: "…" }`, returning `null` from the repository function silently discards the Supabase error. `useUpload`'s generic fallback message "Upload failed — please try again." appears. The actual error (RLS, 413, JWT expired) is invisible to the user and to the developer.

**Fix applied:** `uploadPlanFile` now throws `new Error(uploadError)` on storage failure and `new Error(dbError.message)` on DB failure. `useUpload`'s try/catch captures the thrown message and surfaces it in `FileDropZone`.

**How to apply:** Any repository function that is called through `useUpload`/`FileDropZone` should throw rather than return null, so the real error propagates to the UI.

## Fatal vs. retryable errors in uploadToStorage
RLS violations, JWT errors, and HTTP 413 (file size) will never succeed on retry. The original `isFatal` check only caught "already exists" / "Duplicate". These fatal patterns have been added: `security policy`, `unauthorized`, `jwt`, `payload too large`, `file size limit`, `entity too large`.
