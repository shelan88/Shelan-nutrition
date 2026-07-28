/**
 * api/sitemap.js — Dynamic XML sitemap.
 *
 * Queries Supabase for published blog posts and active services/programs,
 * then returns a well-formed sitemap.xml that search engines can consume.
 *
 * Mounted in api/server.js:
 *   GET /sitemap.xml  → sitemapHandler
 *
 * The static public/sitemap.xml covers known routes for Vercel CDN.
 * This endpoint supplements it with live dynamic content (blog, services, programs).
 */

import { adminClient } from "./_lib/clients.js";

const SITE_URL = process.env.WEBSITE_URL ?? "https://shilan.com";

function urlEntry(loc, opts = {}) {
  const { lastmod, changefreq = "monthly", priority = "0.7" } = opts;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

/** @param {import('express').Request} _req @param {import('express').Response} res */
export default async function sitemapHandler(_req, res) {
  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages = [
    urlEntry(`${SITE_URL}/`,           { changefreq: "weekly",  priority: "1.0" }),
    urlEntry(`${SITE_URL}/about`,      { changefreq: "monthly", priority: "0.8" }),
    urlEntry(`${SITE_URL}/services`,   { changefreq: "monthly", priority: "0.9" }),
    urlEntry(`${SITE_URL}/blog`,       { changefreq: "weekly",  priority: "0.8" }),
    urlEntry(`${SITE_URL}/contact`,    { changefreq: "yearly",  priority: "0.7" }),
    urlEntry(`${SITE_URL}/booking`,    { changefreq: "monthly", priority: "0.9" }),
    urlEntry(`${SITE_URL}/assessment`, { changefreq: "monthly", priority: "0.7" }),
  ];

  const dynamicPages = [];

  try {
    const [blogResult, servicesResult, programsResult] = await Promise.all([
      adminClient
        .from("blog_posts")
        .select("slug, updated_at, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false }),
      adminClient
        .from("services")
        .select("slug, updated_at")
        .eq("active", true),
      adminClient
        .from("programs")
        .select("id, updated_at")
        .eq("active", true),
    ]);

    for (const post of blogResult.data ?? []) {
      if (post.slug) {
        dynamicPages.push(
          urlEntry(`${SITE_URL}/blog/${post.slug}`, {
            lastmod: post.updated_at ?? post.published_at,
            changefreq: "monthly",
            priority: "0.6",
          })
        );
      }
    }

    for (const svc of servicesResult.data ?? []) {
      if (svc.slug) {
        dynamicPages.push(
          urlEntry(`${SITE_URL}/services/${svc.slug}`, {
            lastmod: svc.updated_at,
            changefreq: "monthly",
            priority: "0.7",
          })
        );
      }
    }

    for (const prog of programsResult.data ?? []) {
      if (prog.id) {
        dynamicPages.push(
          urlEntry(`${SITE_URL}/programs/${prog.id}`, {
            lastmod: prog.updated_at,
            changefreq: "monthly",
            priority: "0.6",
          })
        );
      }
    }
  } catch {
    // Fall back to static-only if DB is unreachable
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPages,
    ...dynamicPages,
    "</urlset>",
  ].join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(xml);
}
