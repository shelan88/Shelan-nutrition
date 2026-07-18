---
name: Client portal — durable decisions
description: Key design decisions and security constraints for the client self-service portal that are not derivable from reading the current code.
---

# Client Portal — Durable Decisions

## SECURITY DEFINER upsert pattern for client linking

**Rule:** Never accept `p_user_id` or `p_email` as parameters to a SECURITY DEFINER function — a privileged function that trusts caller-supplied identity is equivalent to no access control. Identity must be derived from `auth.uid()` and `auth.email()` inside the function body.

**Why:** Any authenticated user can call an RPC with arbitrary parameter values. A SECURITY DEFINER function that uses `p_user_id = caller's own UID` is trivially bypassed by passing a different UID, allowing cross-client row hijacking.

**How to apply:** The `upsert_client_from_auth` RPC takes only decorative fields (name, initials, color, status, risk_level, join_date) as parameters. The email/UID used to locate or insert the row come exclusively from `auth.uid()` / `auth.email()`.

## clients RLS layering

**Rule:** When a SECURITY DEFINER RPC handles row creation/linking, the corresponding table needs only: admin_all (full access), client_own_select (WHERE user_id = auth.uid()), client_own_update (USING: user_id = auth.uid(), WITH CHECK: user_id = auth.uid() OR user_id IS NULL). No client INSERT policy on the table itself — the RPC handles that.

**Why:** The WITH CHECK must allow `user_id IS NULL` to support soft-delete (account deactivation clears user_id). Without it, the UPDATE is rejected.

## Assessment RLS ordering

**Rule:** When adding a narrower client-own SELECT policy alongside an existing broad `auth_all` policy, the broad policy must be dropped first. Postgres ORs permissive policies, so the narrow one has no effect while the broad one remains.

**Why:** Discovered during portal RLS tightening — assessment_responses was leaking cross-client data because `auth_all_assessment_responses` (USING true) remained active alongside the new client-own SELECT.

**How to apply:** Any migration that adds a scoped replacement policy must explicitly DROP the broad predecessor in the same migration.

## Portal page loading gate

**Rule:** Portal pages that gate data fetching on a `profile` object must release `loading=false` in the `!profile` branch (when `profileLoading` is also false). Pattern:
```
if (!profile) { if (!profileLoading) setLoading(false); return; }
```

**Why:** If profile is null (no linked client row found), the useEffect early-return leaves local `loading=true` permanently — the page spins forever instead of showing a recoverable empty state.
