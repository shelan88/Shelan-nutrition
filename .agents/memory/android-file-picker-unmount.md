---
name: Android file picker unmounts FileDropZone
description: Root cause and fix for mobile file upload silently failing on Android — FileDropZone unmounted before onChange fires.
---

## The Bug
On Android (Chrome, Samsung Internet, WebView), tapping `<input type="file">` inside a modal opens the native file picker but the selected file is never uploaded. The onChange event is never received.

## Root Cause
**`AuthGuard.tsx` called `setState("loading")` inside its `onAuthStateChange` callback.**

The Supabase JS client has an internal `document.visibilitychange` listener. When the Android browser launches a file picker intent, Chrome goes to the background, `visibilitychange` fires (hidden=true), and Supabase fires `TOKEN_REFRESHED` through `onAuthStateChange`. This caused AuthGuard to call `setState("loading")`, which replaced the entire admin layout with a loading spinner, unmounting every component in the tree — including `NutritionPlansTab` → `FilesModal` → `ModalShell` → `FileDropZone`. When the user returned from the picker and the onChange fired, the input element was gone.

The debug panel confirmed: "File picker opened ✓" (onClick fired) → immediately "FileDropZone UNMOUNTED ⚠" — before the user had even selected a file.

## The Fix
In `src/admin/components/AuthGuard.tsx`, remove `setState("loading")` from the `onAuthStateChange` callback. The loading state is only needed for the initial `getSession()` call. Subsequent auth events (TOKEN_REFRESHED, SIGNED_OUT, etc.) should resolve the new guard state and apply it directly without any loading flash.

**Why:** The loading→authorized cycle tears down `{children}` entirely (renders a spinner instead). Anything that triggers onAuthStateChange while a file picker is open on Android will destroy the file input. Never call setState("loading") in a persistent auth subscription — only in the one-shot initial check.

**How to apply:** Any `AuthGuard` or similar guard pattern with `onAuthStateChange` must NOT set a loading/spinner state inside the subscription callback. Only use loading state during initial resolution. This applies to both admin and portal auth guards.
