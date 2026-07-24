---
name: Android file picker unmounts FileDropZone
description: Root cause and fix for mobile file upload causing page exit on Android — TOKEN_REFRESHED during app-switch triggers unauthorized navigation.
---

## The Bug (Phase 1 — fixed)
On Android (Chrome, Samsung Internet, WebView), tapping `<input type="file">` opened the native file picker but the selected file was never uploaded. The onChange event was never received.

## Root Cause (Phase 1)
**`AuthGuard.tsx` called `setState("loading")` inside its `onAuthStateChange` callback.**

The Supabase JS client has an internal `document.visibilitychange` listener. When the Android browser launches a file picker intent, Chrome goes to the background, `visibilitychange` fires (hidden=true), and Supabase fires `TOKEN_REFRESHED` through `onAuthStateChange`. This caused AuthGuard to call `setState("loading")`, which replaced the entire admin layout with a loading spinner, unmounting every component in the tree — including any open FileDropZone. When the user returned from the picker and the onChange fired, the input element was gone.

## Fix (Phase 1)
Remove `setState("loading")` from the `onAuthStateChange` callback. Loading state is only needed for the initial `getSession()` call.

## The Bug (Phase 2 — fixed)
After Phase 1, the component no longer unmounted, but on Android (Samsung Internet) the page exited entirely and navigated to `/admin/login` after file selection. The upload was lost.

## Root Cause (Phase 2)
**`resolveGuardState()` was still called on `TOKEN_REFRESHED`**, which fires when Android returns from any background activity (including the file picker). `resolveGuardState` queries `admin_profiles` over the network. On Android, the network can be momentarily unavailable during the app-switch back from Samsung Gallery. The query fails → `error` is truthy → `resolveGuardState` calls `supabase.auth.signOut()` and returns `"unauthorized"` → `<Navigate to="/admin/login" replace />` → page exits entirely.

## Fix (Phase 2)
In `AuthGuard.tsx` `onAuthStateChange` callback, **skip re-evaluation entirely when `event === "TOKEN_REFRESHED"`**. TOKEN_REFRESHED only rotates the session token; user identity and authorization are unchanged. Only re-evaluate for events that genuinely change who the user is (SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc.).

**Why:** Never call `resolveGuardState` (which hits the DB) on TOKEN_REFRESHED — the network is unreliable during Android app-switches and any DB error causes a false signOut.

**How to apply:** Any AuthGuard or portal guard with `onAuthStateChange` must guard the callback with `if (event === "TOKEN_REFRESHED") return;` before any async DB check. This applies to both AdminAuthGuard and PortalAuthGuard patterns.
