---
name: Password recovery architecture
description: How Supabase password reset works end-to-end for both customers and admins; root causes of the "signed in on homepage instead of reset form" bug and the fixes applied.
---

## The flow (as built)

1. User clicks "Forgot password" in `AuthModal` or admin `LoginPage`.
2. `resetPasswordForEmail` is called with `redirectTo: \`${window.location.origin}/reset-password\`` (AuthModal) or `https://shelancircle.com/admin/reset-password` (admin LoginPage).
3. Supabase server verifies the token and redirects to `redirectTo` — **only if that URL is in the Supabase Redirect URLs allowlist**. If not, it falls back silently to the Site URL.
4. Browser lands on `/reset-password` (public) or `/admin/reset-password` (admin).
5. `ResetPasswordPage` / `AdminResetPasswordPage` subscribes to `onAuthStateChange`; `INITIAL_SESSION` arrives with the recovery session → shows the form.

## Root causes of the original bug

- `AuthModal.tsx` called `resetPasswordForEmail` **with no `redirectTo`** → Supabase fell back to Site URL (homepage `/`).
- `App.tsx` had **no `PASSWORD_RECOVERY` interceptor** → event fired on the homepage, nobody caught it, user was simply signed in.

## Fixes applied

| File | Change |
|------|--------|
| `src/components/AuthModal.tsx` | Added `redirectTo: \`${window.location.origin}/reset-password\`` |
| `src/pages/ResetPasswordPage.tsx` | New public reset page; handles INITIAL_SESSION + PASSWORD_RECOVERY |
| `src/App.tsx` | Added `PasswordRecoveryInterceptor` (catches PASSWORD_RECOVERY and INITIAL_SESSION with AMR `method:"recovery"` on any page; navigates to `/reset-password`) |
| `src/admin/components/AuthGuard.tsx` | Added `isRecoverySession()` JWT AMR check; sets state `"recovery"` → `<Navigate to="/admin/reset-password">` so admin recovery links that land on `/admin` are still caught |

## Supabase dashboard requirements (cannot be done in code)

Both of these URLs must be in **Authentication → URL Configuration → Redirect URLs**:
- `https://shelancircle.com/reset-password` (customer flow)
- `https://shelancircle.com/admin/reset-password` (admin flow)

Without the allowlist entries, Supabase ignores `redirectTo` and uses the Site URL. The `PasswordRecoveryInterceptor` is a code-side fallback that catches the event wherever it fires, but the proper fix is the allowlist.

**Why:** Supabase recovers silently — no error is thrown when `redirectTo` is rejected; it just uses the Site URL. Always verify the allowlist when the reset form doesn't appear.

## Key implementation detail

`INITIAL_SESSION` fires immediately on every new `onAuthStateChange` subscriber. For recovery sessions (implicit flow), Supabase processes the URL hash synchronously during `createClient()` before React mounts, so `PASSWORD_RECOVERY` has already fired by the time any component subscribes. The `INITIAL_SESSION` + AMR check is what reliably detects recovery sessions for late subscribers.

AMR check: `JSON.parse(atob(session.access_token.split(".")[1])).amr?.some(a => a.method === "recovery")`
