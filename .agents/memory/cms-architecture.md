---
name: Admin CMS architecture
description: Full CMS architecture decisions — new tables, extended tables, admin pages, public page wiring, and mapper pattern.
---

# Admin CMS Architecture

## DB Schema Changes (applied via scripts/migration.sql)

### New Tables
- `programs` — nutrition programs/packages Shelan offers
- `faqs` — frequently asked questions (category, sort_order, published)
- `success_stories` — client transformation stories

### Extended Tables
- `services` + `short_description_en/ar`, `icon`, `image_url`, `slug`, `details JSONB`
- `blog_posts` + `read_time_minutes`, `category`, `author_name`, `author_avatar`, `details JSONB`
- `testimonials` + `avatar_url`, `role_en`, `role_ar`

### JSONB `details` Field Pattern
For `services.details`:
```json
{ "accentFrom": "from-soft-pink", "accentTo": "to-primary-pink",
  "whoIsItFor": { "headline", "headlineAr", "description", "descriptionAr", "points[]", "pointsAr[]" },
  "benefits": { "headline", "headlineAr", "items[]", "itemsAr[]" },
  "cta": { "headline", "headlineAr", "description", "descriptionAr", "buttonLabel", "buttonLabelAr" } }
```

For `blog_posts.details`:
```json
{ "accentFrom": "from-soft-purple", "accentTo": "to-lavender-purple", "featured": true }
```

### Website Settings Keys
Stored in `website_settings` (key-value):
- `site.hero` — kicker, heading, subheading, CTA buttons (all EN/AR)
- `site.about` — name, title, bio, portrait_url (EN/AR)
- `site.contact` — phone, whatsapp, email, address, hours, map_url (EN/AR)
- `site.social` — **SocialLink[] array** (NOT the old flat object). Each item: `{ id, platform, iconEmoji, url, visible, order }`. `migrateLegacySocial()` converts old flat objects on load. State is `socialLinks`/`setSocialLinks` (separate from the generic setterMap/getterMap). The generic tab loading effect has a `if (tab === "social") { ... return; }` branch.

## Admin Pages (all in src/admin/pages/)
All 8 new CMS pages are live (PlaceholderPage replaced):
- `BlogAdminPage.tsx` — CRUD blog posts, bilingual form, list/edit toggle
- `ServicesAdminPage.tsx` — CRUD services with rich details JSONB editor
- `TestimonialsAdminPage.tsx` — CRUD testimonials with star rating
- `FAQAdminPage.tsx` — CRUD FAQs with category filter
- `ProgramsAdminPage.tsx` — CRUD programs with features list
- `SuccessStoriesAdminPage.tsx` — CRUD success stories
- `WebsiteSettingsPage.tsx` — Tabbed editor: Hero | About | Contact | Social
- `MediaLibraryPage.tsx` — File upload to Supabase Storage + grid display

## Public Page Data Pattern
Public pages now fetch from Supabase and map DB rows → CMS types.
The map functions live inline in each page. Key pattern:
```typescript
function mapPost(row: BlogPostRow, lang: string): CMSBlogPost {
  const d = (row.details as any) ?? {};
  return {
    accentFrom: d.accentFrom ?? "from-soft-purple",
    body: content.split("\n\n").filter(Boolean).map(p => ({ type: "paragraph", content: p.trim() })),
    // ...
  };
}
```
All existing section components (BlogFeatured, BlogGrid, ServicesGrid, etc.) remain unchanged.

## Storage Repository
`src/admin/repositories/storage.repository.ts` — uploads to bucket `media`, saves URL to `media_library` table.
Bucket auto-created on first upload if missing.

## New Repositories
- `src/admin/repositories/programs.repository.ts`
- `src/admin/repositories/faqs.repository.ts`
- `src/admin/repositories/success_stories.repository.ts`
- `src/admin/repositories/storage.repository.ts`

## Navigation
3 new nav items added to `src/admin/data/navigation.ts`:
- Programs → `/admin/programs` (Target icon)
- FAQs → `/admin/faqs` (HelpCircle icon)
- Success Stories → `/admin/success-stories` (Trophy icon)
"Website Builder" nav item now points to WebsiteSettingsPage.

## Bilingual Admin UI (Task #5)
All 8 CMS pages are fully bilingual via `const { lang } = useLanguage()`:
- PageHeaders: title, description, breadcrumb labels all use `lang === "ar" ? … : …`
- Action buttons: New/Back/Cancel/Save/Edit/Delete fully bilingual
- Loading/empty/count strings: bilingual
- Search placeholders: bilingual
- Tab labels in WebsiteSettingsPage: bilingual
MediaLibraryPage previously imported `useLanguage` but never destructured it — now destructures `lang`.

## Sidebar Bilingual (Task #8)
Both the desktop logo and mobile drawer "Admin Portal" text are bilingual (`لوحة الإدارة` / `Admin Portal`).
`SidebarLogo` accepts a `lang` prop. "View public site" link text is bilingual.
AuthGuard: two-step gate (session check → role check) — no changes needed, works correctly.
