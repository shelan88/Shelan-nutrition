/**
 * useSEO — Manages all SEO-relevant head elements for every page.
 *
 * Injects and updates:
 *  - <title>
 *  - meta description, robots
 *  - <link rel="canonical">
 *  - Open Graph (og:*) tags
 *  - Twitter Card tags
 *  - JSON-LD structured data (Organization, WebSite + page-specific schemas)
 *
 * All elements are upserted (created if missing, updated if present) so
 * navigating between pages always leaves a clean, correct head.
 *
 * JSON-LD script is removed on unmount so stale data never bleeds through.
 */
import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://shelancircle.com";

const DEFAULT_OG_IMAGE = "/portrait.jpg";
const TWITTER_HANDLE   = "@shelannutrition";

// ---------------------------------------------------------------------------
// Public config type
// ---------------------------------------------------------------------------

export interface SEOConfig {
  /** Full page title including brand suffix, e.g. "About Shelan | SHELAN Nutrition" */
  title: string;
  /** 120–160 character meta description unique to this page */
  description: string;
  /** Pathname only, e.g. "/about" */
  path: string;
  /** Active UI language */
  lang: "en" | "ar";
  /** Defaults to "website"; use "article" for blog posts */
  type?: "website" | "article";
  /** Pathname or absolute URL for the OG image. Defaults to /portrait.jpg */
  image?: string;
  /** Article-specific metadata (used when type === "article") */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  /** Extra JSON-LD objects to include alongside the site-wide Organization + WebSite */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Set true to emit noindex, nofollow (e.g. booking confirmation, portal pages) */
  noIndex?: boolean;
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, extra: Record<string, string> = {}) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.href = href;
  for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
}

function injectJsonLd(id: string, data: unknown) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id   = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

// ---------------------------------------------------------------------------
// JSON-LD builders (exported so pages can compose them)
// ---------------------------------------------------------------------------

export function buildOrganizationLd(lang: "en" | "ar"): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${SITE_URL}/#organization`,
    name: "SHELAN",
    alternateName: lang === "ar" ? "شيلان للتغذية" : "Shelan Nutrition",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 400,
      height: 400,
    },
    image: `${SITE_URL}/portrait.jpg`,
    description:
      lang === "ar"
        ? "أخصائية تغذية معتمدة تقدم استشارات أونلاين متخصصة في الليبيديما، الليمفيديما، صحة المرأة، التغذية الشمولية، وإدارة الوزن — متاحة من أي مكان في العالم."
        : "Certified online nutrition consultant specializing in Lipedema, Lymphedema, women's health, holistic nutrition, anti-inflammatory diets, and weight loss — virtual consultations available worldwide.",
    serviceType: "Online Nutrition Consultation",
    areaServed: "Worldwide",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: SITE_URL,
      serviceType: "Online",
      availableLanguage: ["Arabic", "English"],
    },
    knowsAbout: [
      "Online Nutrition Consultation",
      "Virtual Nutrition Consultation",
      "Lipedema Nutrition",
      "Lymphedema Support",
      "Holistic Nutrition",
      "Women's Health Nutrition",
      "Weight Loss",
      "Anti-inflammatory Nutrition",
    ],
  };
}

export function buildWebsiteLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "SHELAN Nutrition",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbLd(
  items: Array<{ label: string; href?: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

export function buildArticleLd(opts: {
  title: string;
  description: string;
  path: string;
  lang?: "en" | "ar";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    image: opts.image
      ? opts.image.startsWith("http") ? opts.image : `${SITE_URL}${opts.image}`
      : `${SITE_URL}/portrait.jpg`,
    datePublished: opts.publishedTime,
    dateModified: opts.modifiedTime ?? opts.publishedTime,
    author: {
      "@type": "Person",
      name: opts.author ?? "Shelan",
      url: `${SITE_URL}/about`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    keywords: opts.tags?.join(", "),
    inLanguage: opts.lang === "en" ? "en" : "ar",
  };
}

export function buildMedicalServiceLd(opts: {
  name: string;
  description: string;
  path: string;
  lang: "en" | "ar";
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    serviceType: "Online Nutrition Consultation",
    areaServed: "Worldwide",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE_URL}${opts.path}`,
      serviceType: "Online",
    },
    provider: { "@id": `${SITE_URL}/#organization` },
    inLanguage: opts.lang === "ar" ? "ar" : "en",
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSEO(config: SEOConfig) {
  const {
    title,
    description,
    path,
    lang,
    type     = "website",
    image    = DEFAULT_OG_IMAGE,
    article,
    jsonLd,
    noIndex  = false,
  } = config;

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;
    const ogImage      = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    const locale       = lang === "ar" ? "ar_AR" : "en_US";
    const altLocale    = lang === "ar" ? "en_US" : "ar_AR";
    const siteName     = lang === "ar" ? "SHELAN" : "SHELAN Nutrition";

    // ── Title ────────────────────────────────────────────────────────────────
    document.title = title;

    // ── Core meta ────────────────────────────────────────────────────────────
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large");

    // ── Canonical ────────────────────────────────────────────────────────────
    upsertLink("canonical", canonicalUrl);

    // ── Open Graph ───────────────────────────────────────────────────────────
    upsertMeta("property", "og:type",              type);
    upsertMeta("property", "og:url",               canonicalUrl);
    upsertMeta("property", "og:title",             title);
    upsertMeta("property", "og:description",       description);
    upsertMeta("property", "og:image",             ogImage);
    upsertMeta("property", "og:image:width",       "1200");
    upsertMeta("property", "og:image:height",      "630");
    upsertMeta("property", "og:image:alt",         title);
    upsertMeta("property", "og:site_name",         siteName);
    upsertMeta("property", "og:locale",            locale);
    upsertMeta("property", "og:locale:alternate",  altLocale);

    // ── Article-specific OG ──────────────────────────────────────────────────
    if (type === "article" && article) {
      if (article.publishedTime)
        upsertMeta("property", "article:published_time", article.publishedTime);
      if (article.modifiedTime)
        upsertMeta("property", "article:modified_time",  article.modifiedTime);
      if (article.author)
        upsertMeta("property", "article:author",         article.author);
    }

    // ── Twitter Card ─────────────────────────────────────────────────────────
    upsertMeta("name", "twitter:card",        "summary_large_image");
    upsertMeta("name", "twitter:site",        TWITTER_HANDLE);
    upsertMeta("name", "twitter:creator",     TWITTER_HANDLE);
    upsertMeta("name", "twitter:title",       title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image",       ogImage);
    upsertMeta("name", "twitter:image:alt",   title);

    // ── JSON-LD ───────────────────────────────────────────────────────────────
    const pageExtra = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    const schemas   = [buildOrganizationLd(lang), buildWebsiteLd(), ...pageExtra];
    injectJsonLd("json-ld-page", schemas);

    return () => {
      document.getElementById("json-ld-page")?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, lang, type, image, noIndex,
      // stringify article/jsonLd to detect deep changes
      JSON.stringify(article), JSON.stringify(jsonLd)]);
}
