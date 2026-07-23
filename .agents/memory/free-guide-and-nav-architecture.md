---
name: Free Guide system + Navigation architecture
description: How the lead-magnet free guide works and how nav hrefs are permanently derived from sectionIds.
---

# Free Guide / Lead Magnet System

## Tables (migration 20260723000004)
- `free_guide_settings` — single-row config (title_en/ar, subtitle_en/ar, description_en/ar, cta_text_en/ar, pdf_url, email_collection_enabled, active)
- `lead_emails` — visitor emails (id, email, created_at); anon INSERT policy, admin-only SELECT/DELETE

## Repository
`src/admin/repositories/freeGuide.repository.ts` exports:
- `getGuideSettings()` — public, no auth
- `updateGuideSettings(id, patch)` — admin only
- `saveLeadEmail(email)` — anon OK; silently ignores duplicate key (23505)
- `getLeadEmails()` / `deleteLeadEmail(id)` — admin only

## Public component
`src/components/LeadMagnet.tsx` — fully DB-driven:
- Loads settings from `getGuideSettings()` on mount
- If `pdf_url` is null → shows "coming soon" clock state, no broken button
- If `email_collection_enabled`: captures email, calls `saveLeadEmail`, then `triggerDownload`
- If not: shows direct download button
- Section has `id="free-guide"` for anchor nav

## Admin page
`src/admin/pages/FreeGuideAdminPage.tsx`:
- Two tabs: Guide Settings + Collected Emails
- Amber warning banner when `pdf_url` is null
- FileUploadField for PDF (folder: "guides")
- Email list with delete (confirm dialog)

# Navigation Architecture

## Canonical anchor map
`src/lib/sectionAnchors.ts` exports `SECTION_HREFS` (Record<string, string>) and `getSectionHref(sectionId, fallback?)`.

**Why:** hrefs must never be stored/editable in DB because they're structural. A single source of truth prevents nav items from breaking scroll-to-section behaviour.

## How it works
- Every nav item has a `sectionId` (permanent, never changes)
- At runtime: `href = sectionId ? getSectionHref(sectionId) : item.href` (fallback for legacy rows)
- When saving nav items in admin, derived href is written back to DB so old code reading `item.href` still works

## Section id fixes applied
- Hero: `id="top"` → `id="hero"`
- Booking: `id="booking"` → `id="consultations"` (canonical sectionId matches)
- LeadMagnet: added `id="free-guide"`

## Files involved
- `src/lib/sectionAnchors.ts` — the map
- `src/components/Navbar.tsx` — reads sectionId, derives href via getSectionHref
- `src/admin/pages/WebsiteSettingsPage.tsx` — DEFAULT_NAV_ITEMS updated with all sectionIds; href field is read-only (shows 🔒 canonical link)
