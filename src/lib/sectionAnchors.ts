/**
 * Canonical section-anchor map.
 *
 * This is the SINGLE source of truth for where each navigable section lives.
 * Both the public Navbar and the admin WebsiteSettingsPage derive hrefs from
 * this map — the href is NEVER stored in the database or editable by the admin.
 *
 * Reordering nav items only changes their visual position; it can never break
 * where a link navigates because the destination is always looked up here.
 *
 * ── Adding a new section ─────────────────────────────────────────────────────
 * 1. Add the section ID + href here.
 * 2. Add the matching id="<sectionId>" attribute to the section component.
 * 3. Add a default nav item in WebsiteSettingsPage.tsx DEFAULT_NAV_ITEMS.
 * That's it — no other files need to change.
 */

export const SECTION_HREFS: Record<string, string> = {
  // ── Single-page anchor sections (scroll on home page) ─────────────────────
  "home":            "/",
  "about":           "/#about",
  "services":        "/#services",
  "programs":        "/#programs",
  "consultations":   "/#consultations",   // ← was /#booking; Booking.tsx now uses id="consultations"
  "success-stories": "/#success-stories",
  "testimonials":    "/#testimonials",
  "info-hub":        "/#info-hub",
  "faq":             "/#faq",
  "free-guide":      "/#free-guide",

  // ── Separate route pages ──────────────────────────────────────────────────
  "blog":            "/blog",
  "contact":         "/contact",

  // ── CTA (booking form page) ───────────────────────────────────────────────
  "booking-cta":     "/booking",
};

/**
 * Return the canonical href for a nav item.
 *
 * @param sectionId  - the permanent section identifier (e.g. "programs")
 * @param fallback   - optional legacy href from the DB (used only when sectionId is unknown)
 */
export function getSectionHref(sectionId: string, fallback?: string): string {
  return SECTION_HREFS[sectionId] ?? fallback ?? `/#${sectionId}`;
}
