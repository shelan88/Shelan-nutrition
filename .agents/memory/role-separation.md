---
name: Admin/Client role separation
description: How the two user domains are enforced across routing, hooks, and navigation — and the bugs that were fixed.
---

## Rule
Admin and client are completely separate domains. Never assume an authenticated user is a client.

**Why:** The system has two identity tables — `admin_profiles` (role: admin|staff) and `clients` (presence = client). A Supabase Auth user may exist in either, not both.

## Role determination
- Admin: `admin_profiles` row with `user_id = auth.uid()` and `role IN ('admin','staff')`
- Client: `clients` row with `user_id = auth.uid()` (no explicit role column)
- Check performed via: `supabase.from("admin_profiles").select("id").eq("user_id", uid).in("role", ["admin","staff"]).maybeSingle()`

## Route guards
- `/admin/*` — `AuthGuard` (src/admin/components/AuthGuard.tsx): checks admin_profiles, fails closed (signs out + redirects)
- `/portal/*` — `PortalLayout` (src/portal/components/PortalLayout.tsx): checks session AND admin_profiles; if admin, redirects to /admin
- Public routes — no guard

## Admin profile page
- Lives at `/admin/profile` → `AdminProfilePage` (src/admin/pages/AdminProfilePage.tsx)
- Reads name/email from `supabase.auth.getUser()` (user_metadata.full_name + email)
- Reads role from `admin_profiles`
- Updates name via `supabase.auth.updateUser({ data: { full_name } })`
- Updates password via `supabase.auth.updateUser({ password })`
- Contains NO client medical data

## Topbar user menu
- Now reads real admin name/email from `supabase.auth.getUser()` on mount
- Profile link → `/admin/profile` (not /admin/settings)
- Settings link removed from dropdown (still in sidebar)
- Initials computed dynamically from real name

## useClientProfile hook
- Before auto-creating a client row for an unauthenticated-then-auth user, it now checks admin_profiles first
- If the user is an admin, returns null profile without creating a clients row
- Prevents ghost client records being created for admin accounts

## Navbar (public site)
- Desktop dropdown and mobile overlay both gate PORTAL_NAV on `!isAdmin`
- Admins see "Admin Dashboard" link instead of client portal links
- Avatar fetch from `clients` table skipped for admins (no clients row exists)
- `applySession` now integrates admin check before avatar fetch (single consistent flow)

## How to apply
- Any new hook or component that conditionally loads data based on auth session must first check admin_profiles before assuming the user is a client
- Any new route in /portal/* is automatically protected by PortalLayout
- Any new route in /admin/* is automatically protected by AuthGuard
