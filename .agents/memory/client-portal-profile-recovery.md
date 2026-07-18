---
name: Client portal profile auto-recovery
description: Why useClientProfile auto-creates the clients row and how the auth flow connects to it.
---

# Client portal profile auto-recovery

## The rule
`useClientProfile` must call `upsertClientFromAuth` and retry if a session exists but no `clients` row is found. Every authenticated user must always have a profile — no error state, no manual DB insertion required.

**Why:** Three paths can leave a user with no `clients` row:
1. Email-confirmed signup: `upsertClientFromAuth` was never called (modal returns early to "check email" screen).
2. Race condition on login: `upsertClientFromAuth` was called non-blocking, `onAuthStateChange` fired before the RPC finished.
3. Auth-state reload: hook re-runs on session events before the upsert settles.

**How to apply:** The hook already contains the fix — in the `load()` function, after `maybeSingle()` returns `null` with no error, it calls `upsertClientFromAuth(session.user)` then re-fetches. Do not remove this recovery block. AuthModal also awaits the upsert (not fire-and-forget) to eliminate the race window, but the hook recovery is the primary guarantee.

## ProfilePage loading gate
`if (loading || (!profile && !error))` — stays on spinner during recovery. Falls through to the error state only after a confirmed DB error. Never shows a dead-end Arabic error message to a normal authenticated user.
