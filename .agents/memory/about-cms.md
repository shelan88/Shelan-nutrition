---
name: About page CMS
description: DB-driven qualifications, expertise, and certifications for the About page — tables, repos, admin page, and public component wiring.
---

# About Page CMS

## Tables (migration 20260723000005)
- `about_qualifications` — bilingual bullet items (text_en/ar, active, sort_order)
- `about_expertise` — same shape as qualifications
- `about_certifications` — cards (title/subtitle EN+AR, logo_url, initials, display_mode: "logo"|"initials", active, sort_order)
- `about_certifications_settings` — single-row section config (visible, heading_en/ar, description_en/ar, bg_color, note_en/ar)
- Storage bucket: `cert-logos` (5MB limit, PNG/JPG/WebP/SVG)

## Repository
`src/admin/repositories/aboutCms.repository.ts` — CRUD + reorder for all 4 entities, uploadCertLogo/deleteCertLogo helpers.

## Admin page
`src/admin/pages/AboutAdminPage.tsx` — 4 tabs:
1. Qualifications — drag-and-drop list + CRUD + active toggle
2. Areas of Expertise — same structure
3. Certifications — logo upload OR initials mode, live card preview
4. Section Settings — visibility, heading, description, bg_color, note

Route: `/admin/about-cms`

## Public components updated
- `src/sections/about/AboutCertifications.tsx` — now DB-driven; falls back to hardcoded data if DB empty; respects `visible` setting; shows initials or logo based on `display_mode`
- `src/components/About.tsx` — homepage About section now loads qualifications + expertise from DB; shows Expertise subsection only when DB has items; falls back to content.ts credentials

## Why initials palette matters
`AboutCertifications.tsx` cycles through INITIALS_PALETTE array (6 gradient combos) so each badge has a different color even without uploading a logo.
