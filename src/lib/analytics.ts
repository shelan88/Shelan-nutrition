/**
 * analytics.ts — Google Analytics 4 integration for SHELAN Nutrition.
 *
 * Design decisions:
 *  - Loads only in production (import.meta.env.PROD). Zero overhead in dev.
 *  - gtag.js injected dynamically with `async` — never blocks rendering or SEO crawls.
 *  - send_page_view is disabled on config so React Router controls every page_view.
 *  - All exported functions are safe no-ops when gtag has not loaded.
 *  - TypeScript-strict — no `any`, no global pollution beyond the standard gtag interface.
 *
 * Boot sequence (called once in main.tsx):
 *   initGA() → injects <script async src="gtag.js"> + bootstraps window.dataLayer
 *
 * SPA page tracking (called in App.tsx RouteLogger on every pathname change):
 *   trackPageView(pathname, document.title)
 *
 * Custom conversion events (called at exact success moments in each flow):
 *   trackEvent("booking_submitted")
 *   trackEvent("contact_form_submitted")
 *   trackEvent("assessment_started")
 *   trackEvent("assessment_completed")
 */

const GA_ID   = "G-DK4S6JEGRZ";
const IS_PROD = import.meta.env.PROD;

// ---------------------------------------------------------------------------
// Window type augmentation — minimal, avoids @types/gtag.js dependency
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag:      (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Initialise GA4 — call once at app boot, before any React render
// ---------------------------------------------------------------------------

let _initialised = false;

export function initGA(): void {
  if (!IS_PROD || _initialised) return;
  _initialised = true;

  // 1. Bootstrap dataLayer before the remote script arrives so no events are lost
  window.dataLayer = window.dataLayer ?? [];

  // Rest-params wrapper is TypeScript-friendly and behaviourally equivalent
  // to Google's standard `function gtag(){dataLayer.push(arguments);}` snippet.
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());

  // Disable automatic page_view — React Router will fire it manually.
  // enhanced_measurement.page_changes also off for the same reason.
  window.gtag("config", GA_ID, {
    send_page_view: false,
    enhanced_measurement: { page_changes: false },
  });

  // 2. Inject the gtag.js loader — async so it never blocks the critical path
  const script     = document.createElement("script");
  script.async     = true;
  script.src       = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// SPA page view — call on every React Router navigation
// ---------------------------------------------------------------------------

export function trackPageView(path: string, title: string): void {
  if (!IS_PROD || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path:     path,
    page_title:    title,
    page_location: window.location.origin + path,
  });
}

// ---------------------------------------------------------------------------
// Custom events
// ---------------------------------------------------------------------------

export type GAEventName =
  | "booking_submitted"
  | "contact_form_submitted"
  | "assessment_started"
  | "assessment_completed";

/**
 * Fire a named GA4 custom event with optional extra parameters.
 * All params must be strings, numbers, or booleans — no objects or arrays.
 */
export function trackEvent(
  name: GAEventName,
  params?: Record<string, string | number | boolean>,
): void {
  if (!IS_PROD || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
