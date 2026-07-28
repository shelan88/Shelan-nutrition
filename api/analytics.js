/**
 * api/analytics.js — Google Analytics 4 Data API proxy.
 *
 * Vercel Serverless Function  →  GET /api/analytics?days=30
 * Also mounted in api/server.js for local Express routing on Replit.
 *
 * Security model:
 *  - Requires a valid Supabase JWT (admin session) via Authorization header.
 *  - All Google credentials stay server-side — never exposed to the browser.
 *  - Returns 503 with a clear message when credentials are not yet configured.
 *
 * Required environment variables:
 *   GA4_PROPERTY_ID      — numeric GA4 property ID (e.g. 123456789)
 *                          NOT the measurement ID (G-XXXXXXXX)
 *   GOOGLE_CLIENT_EMAIL  — service account email from the JSON key file
 *   GOOGLE_PRIVATE_KEY   — PEM private key (literal \n OK — normalised below)
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { verifyJwt } from "./_lib/auth.js";

// ── Credentials (read at module load so cold-start config errors are obvious) ──
const PROPERTY_ID   = process.env.GA4_PROPERTY_ID;
const CLIENT_EMAIL  = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

/** @param {import('express').Request} req @param {import('express').Response} res */
export default async function handler(req, res) {
  // ── Auth guard ───────────────────────────────────────────────────────────────
  const user = await verifyJwt(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Credentials check ────────────────────────────────────────────────────────
  if (!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    return res.status(503).json({
      error: "not_configured",
      message:
        "Google Analytics credentials are not yet set. " +
        "Add GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY " +
        "as environment variables.",
    });
  }

  // ── Parse params ─────────────────────────────────────────────────────────────
  const rawDays = req.query?.days ?? req.url?.split("days=")[1]?.split("&")[0];
  const days    = Math.min(Math.max(parseInt(rawDays ?? "30", 10), 1), 365);
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };
  const property  = `properties/${PROPERTY_ID}`;

  // ── GA4 client ───────────────────────────────────────────────────────────────
  const client = new BetaAnalyticsDataClient({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  });

  try {
    // Run all six report requests in parallel for minimum latency
    const [
      summaryRes,
      trendRes,
      pagesRes,
      sourcesRes,
      countriesRes,
      devicesRes,
    ] = await Promise.all([
      // 1. Summary totals (no dimension)
      client.runReport({
        property,
        metrics: [
          { name: "activeUsers" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        dateRanges: [dateRange],
      }),

      // 2. Daily trend — sessions + users per day
      client.runReport({
        property,
        dimensions: [{ name: "date" }],
        metrics:    [{ name: "sessions" }, { name: "activeUsers" }],
        dateRanges: [dateRange],
        orderBys:   [{ dimension: { dimensionName: "date" } }],
      }),

      // 3. Top pages by page views
      client.runReport({
        property,
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics:    [{ name: "screenPageViews" }, { name: "activeUsers" }],
        dateRanges: [dateRange],
        orderBys:   [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit:      10,
      }),

      // 4. Traffic sources / channel groups
      client.runReport({
        property,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics:    [{ name: "sessions" }],
        dateRanges: [dateRange],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
      }),

      // 5. Countries
      client.runReport({
        property,
        dimensions: [{ name: "country" }],
        metrics:    [{ name: "sessions" }, { name: "activeUsers" }],
        dateRanges: [dateRange],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
        limit:      10,
      }),

      // 6. Device categories
      client.runReport({
        property,
        dimensions: [{ name: "deviceCategory" }],
        metrics:    [{ name: "sessions" }],
        dateRanges: [dateRange],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    ]);

    // ── Parse helpers ─────────────────────────────────────────────────────────
    const metric = (row, idx) =>
      parseFloat(row.metricValues?.[idx]?.value ?? "0");
    const dim    = (row, idx) =>
      row.dimensionValues?.[idx]?.value ?? "";

    // 1. Summary
    const sRow   = summaryRes[0]?.rows?.[0];
    const summary = sRow
      ? {
          activeUsers:             Math.round(metric(sRow, 0)),
          totalUsers:              Math.round(metric(sRow, 1)),
          newUsers:                Math.round(metric(sRow, 2)),
          sessions:                Math.round(metric(sRow, 3)),
          pageViews:               Math.round(metric(sRow, 4)),
          bounceRate:              parseFloat(metric(sRow, 5).toFixed(1)),
          avgSessionDurationSecs:  Math.round(metric(sRow, 6)),
        }
      : {
          activeUsers: 0, totalUsers: 0, newUsers: 0,
          sessions: 0, pageViews: 0, bounceRate: 0, avgSessionDurationSecs: 0,
        };

    // 2. Trend (format date YYYYMMDD → YYYY-MM-DD)
    const trend = (trendRes[0]?.rows ?? []).map(row => ({
      date:     dim(row, 0).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      sessions: Math.round(metric(row, 0)),
      users:    Math.round(metric(row, 1)),
    }));

    // 3. Top pages
    const topPages = (pagesRes[0]?.rows ?? []).map(row => ({
      path:  dim(row, 0),
      title: dim(row, 1),
      views: Math.round(metric(row, 0)),
      users: Math.round(metric(row, 1)),
    }));

    // 4. Sources
    const sources = (sourcesRes[0]?.rows ?? []).map(row => ({
      channel:  dim(row, 0),
      sessions: Math.round(metric(row, 0)),
    }));

    // 5. Countries
    const countries = (countriesRes[0]?.rows ?? []).map(row => ({
      country:  dim(row, 0),
      sessions: Math.round(metric(row, 0)),
      users:    Math.round(metric(row, 1)),
    }));

    // 6. Devices
    const devices = (devicesRes[0]?.rows ?? []).map(row => ({
      device:   dim(row, 0),
      sessions: Math.round(metric(row, 0)),
    }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      days,
      summary,
      trend,
      topPages,
      sources,
      countries,
      devices,
    });
  } catch (err) {
    console.error("[analytics] GA4 Data API error:", err?.message ?? err);

    // Surface a structured error so the frontend can show a helpful message
    const isAuthError =
      err?.message?.includes("PERMISSION_DENIED") ||
      err?.message?.includes("invalid_grant") ||
      err?.message?.includes("not found") ||
      err?.code === 403 ||
      err?.code === 404;

    return res.status(500).json({
      error:   isAuthError ? "auth_error" : "api_error",
      message: isAuthError
        ? "Permission denied — ensure the service account has 'Viewer' access to the GA4 property and the Analytics Data API is enabled."
        : "Failed to fetch analytics data. Check server logs.",
      detail: err?.message ?? String(err),
    });
  }
}
