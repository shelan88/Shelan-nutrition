---
name: Admin dark mode implementation
description: How admin dark mode works — CSS variable approach, class application, flash prevention.
---

## Rule
`AdminLayout.tsx` contains an inner component `AdminShellInner` (must be inside `<AdminProvider>`) that reads `theme` from `useAdmin()` and adds `class="dark"` to `.admin-shell` when theme is dark.

`AdminContext` initialises `theme` from localStorage synchronously (lazy `useState` initializer), so the correct class is applied on the very first React render — no flash.

## CSS structure
- Light tokens declared in `.admin-shell { --admin-bg: ...; }` in `src/index.css`
- Dark tokens declared in `.admin-shell.dark { --admin-bg: ...; }` immediately below
- Hardcoded Tailwind status-badge colours (`bg-emerald-50`, `bg-red-50`, `bg-amber-50`, `bg-blue-50`, their `text-*-600/700` pairs, `hover:bg-red-50`) are overridden with scoped rules under `.admin-shell.dark`
- `bg-white` is deliberately NOT overridden — toggle-switch thumbs use it and must stay light

**Why:** All structural elements already used `var(--admin-*)` tokens, so re-declaring tokens is enough to repaint the entire shell. Only status-badge colours required extra rules.

## Persistence
`AdminContext` writes to `localStorage` key `shelan-admin-theme` on every toggle. It also reads on init, so theme survives page reloads and logout/login cycles.

## Sync between buttons
Both Topbar theme button and AdminProfilePage theme button call `toggleTheme` from `useAdmin()` — they share one source of truth and stay in sync automatically.

## Public site isolation
The `.dark` class is only ever added to `.admin-shell`. All dark CSS rules are scoped under `.admin-shell.dark`, so the public website is completely unaffected.
