# SHELAN NUTRITION — ENGINEERING AUDIT REPORT
### Release Candidate Review · July 18, 2026

---

## PHASE 1 & 2 — MODULE STATUS

---

### 🔐 AUTHENTICATION

| Item | Status | Notes |
|------|--------|-------|
| Admin login | ✅ Complete | `LoginPage.tsx` → Supabase email/password |
| Admin session guard | ✅ Complete | `AuthGuard.tsx` checks session + `admin_profiles` row |
| Admin role enforcement | ✅ Complete | Queries `role IN ('admin','staff')` before granting access |
| Client portal guard | ✅ Complete | `PortalLayout.tsx` checks session + redirects admins to `/admin` |
| Cross-role protection | ✅ Complete | Admin cannot enter portal; client cannot enter admin |
| `useClientProfile` admin guard | ✅ Complete | Returns `null` for admins; never auto-creates `clients` row |
| Forgot password | 🟡 Partial | Link shown in `LoginPage.tsx`; relies on Supabase default email — no branded template |
| Assessment page auth | 🟡 Partial | `/assessment/respond/:id` is a public route; ownership is validated by matching `appointment.id` in the URL — no explicit session guard at the route level |

---

### 🗺️ ROUTING

| Path | Guard | Status |
|------|-------|--------|
| `/` | None | ✅ `HomePage` — real data |
| `/about` | None | ✅ `AboutPage` — hardcoded content |
| `/services`, `/services/:id` | None | ✅ Real Supabase data |
| `/blog`, `/blog/:slug` | None | ✅ Real Supabase data |
| `/contact` | None | ✅ Social links from DB, rest hardcoded |
| `/booking` | None | 🟡 Real appointment creation; **payment step is fake** |
| `/assessment` | None | 🟡 Public page — shows link; wizard uses localStorage draft |
| `/assessment/respond/:id` | None | ✅ Full questionnaire flow via DB |
| `/portal/profile` | `PortalLayout` | ✅ Complete |
| `/portal/appointments` | `PortalLayout` | ✅ Complete |
| `/portal/assessments` | `PortalLayout` | 🟡 View history only; filling redirects to public route |
| `/portal/nutrition` | `PortalLayout` | ✅ Complete |
| `/portal/progress` | `PortalLayout` | ✅ Complete |
| `/portal/files` | `PortalLayout` | ✅ Complete |
| `/portal/settings` | `PortalLayout` | 🟡 Notification prefs stored in `localStorage` only |
| `/admin` | `AuthGuard` | ✅ Dashboard — real data |
| `/admin/clients` | `AuthGuard` | ✅ Complete |
| `/admin/clients/:id` | `AuthGuard` | ✅ Complete clinical workspace |
| `/admin/bookings` | `AuthGuard` | ✅ Complete |
| `/admin/assessments` | `AuthGuard` | ✅ Complete |
| `/admin/question-library` | `AuthGuard` | ✅ Complete |
| `/admin/blog` | `AuthGuard` | ✅ Complete |
| `/admin/services` | `AuthGuard` | ✅ Complete |
| `/admin/programs` | `AuthGuard` | ✅ Complete |
| `/admin/testimonials` | `AuthGuard` | ✅ Complete |
| `/admin/faqs` | `AuthGuard` | ✅ Complete |
| `/admin/success-stories` | `AuthGuard` | ✅ Complete |
| `/admin/media` | `AuthGuard` | ✅ Complete |
| `/admin/messages` | `AuthGuard` | ✅ Complete (one-way inbox) |
| `/admin/social` | `AuthGuard` | ✅ Complete |
| `/admin/seo` | `AuthGuard` | 🟡 Stores settings; **never applied to public pages** |
| `/admin/website-settings` | `AuthGuard` | ✅ Complete |
| `/admin/profile` | `AuthGuard` | ✅ Complete |
| `/admin/payments` | `AuthGuard` | ❌ PlaceholderPage |
| `/admin/analytics` | `AuthGuard` | ❌ PlaceholderPage |
| `/admin/settings` | `AuthGuard` | ❌ PlaceholderPage |

---

### 👩‍💼 ADMIN MODULE

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard KPIs | ✅ Complete | Live counts from Supabase |
| Upcoming appointments panel | ✅ Complete | Live |
| Recent messages panel | ✅ Complete | Live |
| Revenue on dashboard | ❌ Missing | Always 0 — no payment data |
| Client list | ✅ Complete | Search, filter, pagination |
| Client profile workspace | ✅ Complete | 8 tabs, all wired |
| Client inline edit (drawer) | ✅ Complete | ClientDrawer functional |
| Bookings calendar/list | ✅ Complete | Status management works |
| Assessment templates | ✅ Complete | Full CRUD + duplicate + bundles |
| Question library | ✅ Complete | Shared pool, reuse tracking |
| Template assignment to client | ✅ Complete | |
| View submitted responses | ✅ Complete | ResponseDrawer |
| Compare responses (same template) | ✅ Complete | Two-column diff view |
| Compare responses (cross-template) | ❌ Missing | Question normalisation logic not built |
| CMS: Blog | ✅ Complete | |
| CMS: Services | ✅ Complete | |
| CMS: Programs | ✅ Complete | |
| CMS: Testimonials | ✅ Complete | |
| CMS: FAQs | ✅ Complete | |
| CMS: Success Stories | ✅ Complete | |
| CMS: Media Library | ✅ Complete | |
| Social media settings | ✅ Complete | |
| SEO settings | 🟡 Partial | Saves to DB; **no public consumer reads it** |
| Website settings | ✅ Complete | Hero/About/CTA text editable |
| Messages inbox | ✅ Complete | Archive, delete, mark replied |
| Messages sidebar badge | 🟡 Partial | **Hardcoded "3" in navigation.ts:163** — live count never wired to sidebar |
| Admin Profile | ✅ Complete | Name, password, language, theme |
| Payments admin | ❌ Missing | PlaceholderPage |
| Analytics admin | ❌ Missing | PlaceholderPage |
| Settings admin | ❌ Missing | PlaceholderPage |
| Staff management | ❌ Missing | `getAllAdminProfiles` exists in repo; no UI |

---

### 🏠 CLIENT PORTAL

| Feature | Status | Notes |
|---------|--------|-------|
| Profile — view/edit | ✅ Complete | Avatar upload works |
| Appointments — view list | ✅ Complete | Shows history |
| Appointments — book new | 🟡 Partial | Links to `/booking` (public page); payment step is fake |
| Assessments — view history | ✅ Complete | Past responses viewable |
| Assessments — fill questionnaire | 🟡 Partial | Redirects to `/assessment/respond/:id`; works but lives outside portal |
| Nutrition plans — view | ✅ Complete | Meals, goals, file downloads |
| Progress — weight chart | ✅ Complete | SVG line chart |
| Progress — photos | ✅ Complete | Photo history from Supabase Storage |
| Files — view/download | ✅ Complete | Uses signed URL generation |
| Files — delete | ❌ Missing | Admin-only; no client delete path |
| Messages — send to admin | ❌ Missing | No portal messaging; only contact form on public site |
| Settings — password change | ✅ Complete | |
| Settings — language | ✅ Complete | |
| Settings — notifications | 🟡 Partial | Preferences stored in `localStorage` only; lost on logout |
| Settings — account deactivation | ✅ Complete | |

---

### 📰 CMS & PUBLIC PAGES

| Area | Status | Notes |
|------|--------|-------|
| Blog list page | ✅ Complete | Real Supabase data |
| Blog detail page | ✅ Complete | Real Supabase data |
| Services list page | ✅ Complete | Real Supabase data |
| Service detail page | ✅ Complete | Includes template assignment link |
| Programs — homepage section | ✅ Complete | Real data |
| Programs — dedicated `/programs` route | ❌ Missing | No public route exists |
| Testimonials — homepage section | ✅ Complete | Real data |
| FAQs — homepage section | ✅ Complete | Real data |
| FAQ — dedicated `/faq` route | ❌ Missing | No public route exists |
| Success Stories — homepage section | ✅ Complete | Real data |
| Success Stories — dedicated route | ❌ Missing | No public route exists |
| About page | 🟡 Hardcoded | All content in component/content files; no CMS control |
| Contact page | 🟡 Partial | Social links from DB; personal info, map, copy hardcoded |
| Homepage — Hero section | ❌ Hardcoded | Text/image in `content.ts` |
| Homepage — Stats section | ❌ Hardcoded | Numbers in `content.ts` |
| Homepage — About preview | ❌ Hardcoded | Not connected to Website Settings |
| Homepage — InfoHub/Journey/CTA | ❌ Hardcoded | No CMS path |
| SEO meta tags | ❌ Not applied | `SEOPage.tsx` saves to `website_settings`; no `<meta>` tags injected from DB on any public page |
| Booking page | 🟡 Partial | Real appointment creation; payment step has card input fields but no Stripe SDK |

---

### 📋 ASSESSMENTS

| Feature | Status | Notes |
|---------|--------|-------|
| Template CRUD | ✅ Complete | |
| Question library (shared pool) | ✅ Complete | |
| Bundle picker (pre-built templates) | ✅ Complete | Clones into independent templates |
| Assign template to client | ✅ Complete | |
| Client fills questionnaire | ✅ Complete | `/assessment/respond/:id` |
| Draft auto-save | 🟡 Partial | `localStorage` only. Code has explicit TODO to replace with `supabase.from('assessment_drafts')` — the table does **not exist** in any migration |
| Resume incomplete submission | 🟡 Partial | Works within same browser/device via localStorage key; fails on device change or storage clear |
| Admin views responses | ✅ Complete | |
| Admin compare (same template) | ✅ Complete | Two-column diff view |
| Admin compare (cross-template) | ❌ Missing | Question normalisation logic not built |
| Offline submission retry | ❌ Missing | No retry queue or detection |
| Email link to client after booking | ❌ Missing | No email trigger exists |

---

### 🥗 NUTRITION PLANS

| Feature | Status | Notes |
|---------|--------|-------|
| Create plan (admin) | ✅ Complete | Always requires `clientId` — no orphan plans possible |
| Edit plan (creates new version) | ✅ Complete | |
| Version history | ✅ Complete | |
| Duplicate plan | ✅ Complete | |
| Archive / restore | ✅ Complete | |
| Delete draft | ✅ Complete | |
| File attachments per plan | ✅ Complete | |
| Client sees active plan in portal | ✅ Complete | Meals, goals, file downloads |
| Active plan summary in Client Profile Overview | ✅ Complete | Name, status, created date, next review |
| Print PDF | ❌ Missing | UI button is disabled placeholder; no PDF library installed |
| Send to Client | ❌ Missing | UI placeholder; activating plan changes status but sends no notification |

---

### 📁 FILES & STORAGE

| Feature | Status | Notes |
|---------|--------|-------|
| Admin uploads file to client | ✅ Complete | |
| Admin deletes file from client | ✅ Complete | |
| Client views shared files in portal | ✅ Complete | |
| Client downloads file | ✅ Complete | Uses `getSignedDownloadUrl` |
| Client deletes file | ❌ Missing | Admin-only; no portal delete path |
| RLS: client sees only own files | ✅ Complete | Policy restricts by `client_id = auth.uid()` lookup |
| RLS: nutrition plan files | ✅ Complete | Same restrictive policy |
| Broken/expired URL detection | ❌ Missing | No refresh or fallback on 403 |
| Upload progress indicator | 🟡 Partial | Indeterminate pulse shown, not actual bytes-transferred |

---

### 💬 MESSAGES

| Feature | Status | Notes |
|---------|--------|-------|
| Contact form → messages table | ✅ Complete | Anon insert allowed by RLS |
| Admin inbox (view, archive, delete) | ✅ Complete | |
| Admin marks message replied | ✅ Complete | |
| Unread count on dashboard | ✅ Complete | Live from `useDashboardStore` |
| Unread badge on sidebar | ❌ Missing | `getUnreadCount` exists in repo; sidebar badge hardcoded `"3"` in `navigation.ts:163` |
| Bidirectional admin↔client messaging | ❌ Missing | No data model or UI |
| Real-time notifications | ❌ Missing | No Supabase channel subscriptions |

---

### 💳 PAYMENTS / STRIPE

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe SDK | ❌ Missing | No `@stripe/stripe-js` in package.json |
| Payment UI in booking flow | ❌ Fake | `CheckoutModal.tsx` renders card fields but makes no API call |
| Payment confirmation | ❌ Missing | |
| Webhook endpoint | ❌ Missing | |
| Payment records in DB | ❌ Missing | No `payments` or `invoices` table in any migration |
| Admin payments page | ❌ Missing | PlaceholderPage |

---

### ⚙️ SETTINGS

| Feature | Status | Notes |
|---------|--------|-------|
| Website content settings | ✅ Complete | `WebsiteSettingsPage.tsx` |
| Social media links | ✅ Complete | `SocialMediaAdminPage.tsx` |
| SEO metadata | 🟡 Stored only | `SEOPage.tsx` saves values; nothing reads them for `<head>` |
| Admin system settings | ❌ Missing | `/admin/settings` is PlaceholderPage |

---

### 🗄️ DATABASE / SUPABASE

| Item | Status | Notes |
|------|--------|-------|
| Migrations (17 files) | ✅ Complete | All referenced tables exist |
| RLS on all tables | ✅ Complete | 20+ tables covered |
| SECURITY DEFINER RPCs | ✅ Complete | Correctly use `auth.uid()`, not parameters |
| Single Supabase client | ✅ Complete | `src/lib/supabase.ts` |
| `assessment_drafts` table | ❌ Missing | Referenced in TODO comment; no migration exists |
| `payments` / `invoices` table | ❌ Missing | No payment schema at all |
| Real-time subscriptions | ❌ Missing | No `supabase.channel()` anywhere in codebase |

---

## PHASE 3 — CODE QUALITY FINDINGS

### Dead Code

| Location | Issue |
|----------|-------|
| `src/admin/repositories/dashboard.repository.ts:249–255` | 4 empty no-op stubs: `incrementClients()`, `decrementClients()`, `incrementAppointments()`, `incrementAssessments()` — exported but never called. ESLint suppression comments confirm intentional stubs. |
| `src/admin/repositories/blog.repository.ts:15` | `getPublishedPosts()` — public pages call `supabase` directly, not this function. Never imported anywhere. |
| `src/admin/repositories/profile.repository.ts:25` | `getAllAdminProfiles()` — no staff management UI; function never imported. |
| `src/admin/repositories/assessment-responses.repository.ts:59` | `updateResponseScoring()` — no scoring UI or call site found. |

### Duplicate / Parallel Code

| Issue | Files |
|-------|-------|
| Two `appointments.repository.ts` — admin version queries all; portal enforces `auth.uid()`. Intentional separation but identical function names cause confusion. | `admin/repositories/appointments.repository.ts`, `portal/repositories/appointments.repository.ts` |
| Two `profile.repository.ts` — same pattern. | `admin/repositories/profile.repository.ts`, `portal/repositories/profile.repository.ts` |
| Public pages (`BlogPage.tsx`, `ServicesPage.tsx`) call `supabase` directly instead of using existing admin CMS repositories. Two separate data-fetching paths for the same tables. | `src/pages/BlogPage.tsx:60`, `src/pages/ServicesPage.tsx:79` |

### Hardcoded Values

| Location | Value | Problem |
|----------|-------|---------|
| `src/admin/data/navigation.ts:163` | `badge: "3"` | Static badge count on Messages nav item |
| `src/sections/assessment/AssessmentWizard.tsx:48` | `LS_KEY = "shelan_assessment_draft"` | Draft saved to `localStorage` only |
| `src/portal/pages/SettingsPage.tsx:231` | `"shelan-notif"` | Notification prefs in `localStorage`; lost on logout |
| `src/pages/AboutPage.tsx` | Entire page | No CMS path; all text in component files |
| `src/content/content.ts` | Hero text, Stats numbers, CTA copy | Not editable via admin without code deploy |
| `src/components/CheckoutModal.tsx:508` | `{t.securedBy} Stripe` | Stripe branding without Stripe integration |

### Broken / Disconnected Features

| Feature | Symptom |
|---------|---------|
| SEO admin → public head | `SEOPage.tsx` saves to `website_settings`; no component reads these values to inject `<meta>` tags. Every page only calls `document.title`. No OG tags, no `<meta name="description">`. |
| Website Settings → Homepage | `WebsiteSettingsPage.tsx` manages hero text; but `HomePage.tsx` reads from `content.ts`, not from `website_settings`. The two are disconnected. |
| Messages sidebar badge | `getUnreadCount()` exists in `messages.repository.ts`; `Sidebar.tsx` renders the static string from `navigation.ts:163` (`"3"`). |
| `assessment_drafts` table | `AssessmentWizard.tsx` has a TODO comment referencing it; the table doesn't exist in any migration. |

### Missing Permissions

| Gap | Risk |
|-----|------|
| `/assessment/respond/:id` is fully public — any user who guesses or obtains a UUID can open any assessment link | Medium — UUIDs are hard to guess, but there's no session check |
| `getOwnNutritionPlans` filters by `client_id` parameter passed from profile — if RLS doesn't enforce `auth.uid()` at DB level, a crafted request could fetch another client's plans | Medium — needs RLS audit on `nutrition_plans` |

---

## PHASE 4 — FINAL TODO LIST (PRIORITISED)

---

### 🔴 CRITICAL

**C1 — Payment integration is fake**
- **Problem:** Booking flow collects card details in custom inputs but never calls any payment API. A client can complete the "payment" step with any input and the system records the appointment as if payment succeeded.
- **Root cause:** `CheckoutModal.tsx` was built as a UI prototype. No Stripe SDK was ever installed or integrated.
- **Files:** `src/components/CheckoutModal.tsx`, `src/data/booking.data.ts`, `src/content/content.ts`
- **Estimated work:** 5–8 days
- **Dependencies:** Stripe account + API keys; decision on payment gateway (Stripe vs Tap Payments)

**C2 — SEO meta tags stored but never applied**
- **Problem:** Admin can set meta title, description, OG tags via `SEOPage.tsx`. These are saved to `website_settings`. But every public page only calls `document.title` — zero `<meta>` tags are injected from the database. The site is effectively invisible to search engines and social media preview scrapers.
- **Root cause:** The SEO admin was built without a corresponding consumer. No `react-helmet-async` or equivalent was added.
- **Files:** `src/admin/pages/SEOPage.tsx`, all `src/pages/*.tsx` public pages
- **Estimated work:** 1–2 days
- **Dependencies:** None

**C3 — Messages sidebar badge hardcoded**
- **Problem:** The sidebar always shows `"3"` next to Messages regardless of actual unread count.
- **Root cause:** `navigation.ts:163` has `badge: "3"` as a static string. The live `getUnreadCount()` is never called by `Sidebar.tsx`.
- **Files:** `src/admin/data/navigation.ts:163`, `src/admin/components/Sidebar.tsx`, `src/admin/repositories/messages.repository.ts`
- **Estimated work:** 2 hours
- **Dependencies:** None

---

### 🟠 HIGH

**H1 — Admin Settings page is a placeholder**
- **Problem:** `/admin/settings` renders `PlaceholderPage`. Admins clicking Settings see a blank stub page.
- **Files:** `src/admin/components/AdminLayout.tsx:92`, `src/admin/pages/PlaceholderPage.tsx`
- **Estimated work:** 3–5 days (depends on scope of what settings should exist)
- **Dependencies:** Decision on what admin-configurable settings are needed

**H2 — Assessment draft not persisted to database**
- **Problem:** If a client starts a questionnaire and closes the tab on a different device, their answers are lost. Code has an explicit TODO comment pointing to this exact gap.
- **Root cause:** `AssessmentWizard.tsx` was built with `localStorage` as an MVP draft mechanism. The `assessment_drafts` table referenced in the TODO does not exist in any migration.
- **Files:** `src/sections/assessment/AssessmentWizard.tsx:271`, supabase/migrations/ (table missing)
- **Estimated work:** 1 day
- **Dependencies:** None

**H3 — Portal notification preferences not persisted**
- **Problem:** Notification settings saved to `localStorage` under `"shelan-notif"`. Lost on logout, device change, or browser data clear.
- **Files:** `src/portal/pages/SettingsPage.tsx:231–238`
- **Estimated work:** 4 hours
- **Dependencies:** None

**H4 — Client cannot delete files from portal**
- **Problem:** Portal Files page shows shared files but has no delete button. Admin-side delete exists but no portal-side path.
- **Files:** `src/portal/pages/FilesPage.tsx`, `src/portal/repositories/files.repository.ts`
- **Estimated work:** 4 hours
- **Dependencies:** RLS policy must restrict delete to own files only

**H5 — Website Settings not connected to homepage sections**
- **Problem:** `WebsiteSettingsPage.tsx` saves hero/about/CTA text to `website_settings`. But `HomePage.tsx` reads from `src/content/content.ts` (static TypeScript), completely bypassing the database.
- **Files:** `src/admin/pages/WebsiteSettingsPage.tsx`, `src/pages/HomePage.tsx`, `src/content/content.ts`, all homepage section components
- **Estimated work:** 2–3 days
- **Dependencies:** None

**H6 — Email to client after booking / questionnaire assignment**
- **Problem:** When an admin assigns an assessment template, or a client books an appointment, no email is sent. No way for client to know their questionnaire link unless told manually.
- **Root cause:** No email infrastructure exists (no Edge Function, no email provider).
- **Files:** `src/admin/repositories/assessment-responses.repository.ts`, `src/admin/repositories/appointments.repository.ts`
- **Estimated work:** 2–3 days
- **Dependencies:** Email provider API key; Supabase Edge Function setup

---

### 🟡 MEDIUM

**M1 — Admin Analytics page is a placeholder**
- **Files:** `src/admin/components/AdminLayout.tsx:87`
- **Estimated work:** 5–10 days (basic version: Supabase views + charts; advanced: external analytics)
- **Dependencies:** Decision on analytics scope and data model

**M2 — Admin Payments page is a placeholder**
- **Files:** `src/admin/components/AdminLayout.tsx:83`
- **Estimated work:** 3–5 days
- **Dependencies:** Blocked by C1 (Stripe integration must exist first)

**M3 — Print PDF for nutrition plans (no implementation)**
- **Problem:** "Print PDF" button is disabled with "Coming Soon" tooltip. No PDF library installed.
- **Files:** `src/admin/pages/NutritionPlansTab.tsx`, `src/admin/pages/ClientProfilePage.tsx`
- **Estimated work:** 2–3 days (install `jsPDF` or `html2pdf`, design print layout, style for A4)
- **Dependencies:** None

**M4 — Send to Client for nutrition plans (no backend)**
- **Problem:** "Send to Client" button is a disabled placeholder. Activating a plan changes status but triggers no notification.
- **Files:** `src/admin/pages/NutritionPlansTab.tsx`
- **Estimated work:** 1–2 days
- **Dependencies:** Blocked by H6 (email infrastructure must exist)

**M5 — Compare assessments across different templates**
- **Problem:** `AssessmentCompareModal.tsx` works only for same-template comparisons. Cross-template requires question normalisation logic that doesn't exist.
- **Files:** `src/admin/components/AssessmentCompareModal.tsx`
- **Estimated work:** 3–5 days
- **Dependencies:** None

**M6 — Dedicated public pages for Programs, FAQ, Success Stories**
- **Problem:** CMS content is complete; individual public routes are missing. Only homepage sections exist.
- **Files:** `src/App.tsx` + need to create `ProgramsPage.tsx`, `FAQPage.tsx`, `SuccessStoriesPage.tsx`
- **Estimated work:** 1–2 days per page
- **Dependencies:** None

**M7 — Broken image URL handling (expired storage URLs)**
- **Problem:** Uploaded file URLs stored in DB are public Supabase Storage URLs. If bucket policy changes or URL expires, images show as broken with no fallback.
- **Files:** All components rendering `uploaded_files.url`, `progress_photos.url`, `clients.avatar_url`
- **Estimated work:** 1 day
- **Dependencies:** None

**M8 — Upload progress indicator (indeterminate pulse)**
- **Problem:** File uploads show an indeterminate pulse rather than actual bytes-transferred progress.
- **Estimated work:** 4 hours
- **Dependencies:** None

---

### 🔵 LOW

**L1 — Dead code: dashboard.repository.ts empty stubs**
- **Files:** `src/admin/repositories/dashboard.repository.ts:249–255`
- **Estimated work:** 30 minutes

**L2 — Dead code: `getAllAdminProfiles`, `getPublishedPosts`, `updateResponseScoring`**
- **Files:** `src/admin/repositories/profile.repository.ts`, `blog.repository.ts`, `assessment-responses.repository.ts`
- **Estimated work:** 1 hour

**L3 — Public pages bypass admin repositories**
- **Problem:** `BlogPage.tsx` and `ServicesPage.tsx` call `supabase.from()` directly instead of using existing repository functions. Two separate code paths for the same tables.
- **Files:** `src/pages/BlogPage.tsx:60`, `src/pages/ServicesPage.tsx:79`
- **Estimated work:** 2 hours

**L4 — About page not CMS-manageable**
- **Problem:** All About page content is in `src/content/content.ts`. Admin cannot update bio, photo, or text.
- **Files:** `src/pages/AboutPage.tsx`, `src/content/content.ts`
- **Estimated work:** 1–2 days

**L5 — Silent error handling throughout repositories**
- **Problem:** Every repository catches errors with `console.error` then returns `null`, `[]`, or `false`. UI displays empty state that looks identical to "no data" rather than showing an error.
- **Files:** All 18 repository files
- **Estimated work:** 1–2 days

**L6 — Assessment response page has no session gate**
- **Problem:** `/assessment/respond/:id` is fully public. Ownership validated by appointment UUID in URL only.
- **Files:** `src/App.tsx:109`, `src/pages/AssessmentResponsePage.tsx`
- **Estimated work:** 2 hours

**L7 — Staff management has no UI**
- **Problem:** `getAllAdminProfiles()` exists in repository. `admin_profiles` table supports multiple staff. No UI to invite, manage, or deactivate staff accounts.
- **Files:** `src/admin/repositories/profile.repository.ts`, `src/admin/components/AdminLayout.tsx`
- **Estimated work:** 2–3 days

---

## PHASE 5 — WHY EACH GAP EXISTS

**Payment integration (C1)**
`CheckoutModal.tsx` was built as a UX mockup to show the intended booking + payment flow. The card number, expiry, and CVV fields are raw `<input>` elements with no Stripe Elements behind them. The decision on payment gateway (Stripe vs Tap Payments, which is common in the Gulf market) was deferred, so the backend was never started. There is no webhook endpoint, no server SDK, and no `payments` table in the database. The entire payment step is a form that submits to nothing.

**SEO meta tags not applied (C2)**
The admin SEO settings page was built as part of the CMS expansion. It correctly saves `site.seo` keys to `website_settings`. However, the public pages were never updated to consume these values. Each public page uses `document.title` via `useEffect`, which updates the browser tab title but does not inject `<meta name="description">`, `<meta property="og:*">`, or `<link rel="canonical">` tags. There is no `react-helmet-async` or equivalent in the project. The SEO admin is a write-only feature — nothing reads it publicly.

**Messages badge hardcoded (C3)**
During the navigation UI build, `navigation.ts` was written with a static `badge: "3"` string as a visual placeholder. The `Sidebar.tsx` component renders whatever value is in the nav config — it has no access to the message store. The `getUnreadCount()` function in `messages.repository.ts` was built and is used correctly on the Dashboard page, but the connection between the store and the sidebar badge was never made.

**Admin Settings placeholder (H1)**
`/admin/settings` was listed in `AdminLayout.tsx` from the start as a nav item. The specific settings that would live there (clinic opening hours, booking rules, notification thresholds, etc.) were never scoped into tasks, so the page was never assigned for implementation.

**Assessment draft not in DB (H2)**
`AssessmentWizard.tsx` was written with `localStorage` as a fast MVP path, with two `TODO` comments explicitly calling out the Supabase replacement. The `assessment_drafts` table was never added to any migration file. The TODO has existed across the entire development cycle. The risk is low in ideal conditions (same device, same browser) but breaks completely for mobile-to-desktop switches or private browsing sessions.

**Portal notification preferences in localStorage (H3)**
The portal Settings page was implemented quickly. Notification toggles were added as local state persisted to `localStorage` — the fastest possible approach. The `clients` table has no notification preference columns, and no migration was written to add them. It functions in a single browser session but is not a production-quality implementation.

**Website Settings not connected to homepage (H5)**
The CMS admin for website content (hero, about, CTA) was built and saves correctly to `website_settings`. However the homepage section components (`HeroSection`, `AboutSection`, etc.) predate the CMS and read from the static `content.ts` TypeScript file. When the CMS was built, the public-facing components were not updated to consume the database. The two systems coexist without being wired together.

**Email notifications missing (H6)**
There is no email infrastructure in the project. No Supabase Edge Function, no serverless API, no email provider (Resend, SendGrid, Postmark). All email-dependent features — assessment link delivery, booking confirmation, nutrition plan notification — require this foundation to exist first.

**Dedicated public routes missing (M6)**
Programs, FAQ, and Success Stories were implemented as homepage sections first. Individual route pages were never added to `App.tsx`. The CMS content is complete; the missing piece is a public `<Route>` and a corresponding page component for each content type.

**Print PDF missing (M3)**
No PDF generation library (`jsPDF`, `html2pdf`, `@react-pdf/renderer`) was installed. The button exists in the UI as a placeholder. Generating a well-formatted clinical nutrition plan PDF requires a custom print layout that was never designed.

**Cross-template comparison missing (M5)**
The same-template comparison in `AssessmentCompareModal.tsx` works by aligning questions by their shared `question_id`. Different templates have completely different question sets with no shared identifiers. A cross-template comparison would require either a semantic question mapping layer or a user-driven pairing UI. Neither approach was designed or scoped.

---

## RELEASE READINESS SUMMARY

| Priority | Count | Blockers for Production |
|----------|-------|------------------------|
| 🔴 Critical | 3 | C1 (fake payments) and C2 (no SEO) are hard blockers for any commercial launch |
| 🟠 High | 6 | H1–H6 represent incomplete or misleading features |
| 🟡 Medium | 8 | M1–M8 are missing features, not regressions |
| 🔵 Low | 7 | L1–L7 are quality and maintenance items |

**The application cannot be released commercially until at minimum C1 (payments), C2 (SEO), and C3 (badge) are resolved.**

The clinical workflow (client management, assessments, nutrition plans, progress tracking, portal) is production-quality. The business infrastructure (payments, analytics, email) is the remaining gap before launch.
