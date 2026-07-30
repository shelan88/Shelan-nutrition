/**
 * api/analytics.js — Google Analytics 4 Data API proxy.
 *
 * Vercel Serverless Function  →  GET /api/analytics?days=30
 * Also mounted in api/server.js for local Express routing on Replit.
 *
 * Security model:
 *  - Requires a valid Supabase JWT (admin session) via Authorization header.
 *  - All Google credentials stay server-side — never exposed to the browser.
 *  - Returns 503 with setup instructions when credentials are not yet configured.
 *
 * Implementation:
 *  Uses the GA4 Data API v1 REST endpoint with a manually-signed service-account
 *  JWT (Node built-in `crypto`). This avoids the gRPC / OpenSSL incompatibilities
 *  that affect `@google-analytics/data` in some environments.
 *
 * Required environment variables:
 *   GA4_PROPERTY_ID      — numeric GA4 property ID (e.g. 547340341)
 *                          NOT the measurement ID (G-XXXXXXXX)
 *   GOOGLE_CLIENT_EMAIL  — service account email from the JSON key file
 *   GOOGLE_PRIVATE_KEY   — PEM private key (literal \n chars are normalised below)
 */

import { createSign, createPrivateKey } from "crypto";
import { verifyJwt } from "./_lib/auth.js";

// ── Credentials ───────────────────────────────────────────────────────────────
const PROPERTY_ID  = process.env.GA4_PROPERTY_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// Replit stores multi-line secrets with literal \n and sometimes wraps the whole
// value in double-quotes — strip the quotes first, then normalise \n to newlines.
const PRIVATE_KEY  = process.env.GOOGLE_PRIVATE_KEY
  ?.replace(/^"|"$/g, "")   // strip surrounding quotes added by some secret stores
  ?.replace(/\\n/g, "\n");  // convert literal \n sequences to real newline chars

const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

// ── JWT / access-token helpers ────────────────────────────────────────────────

/** Build a short-lived (1 h) signed JWT for the service account. */
function buildJwt(email, pemKey) {
  const now     = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  })).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const sign         = createSign("SHA256");
  sign.update(signingInput);
  sign.end();

  const key       = createPrivateKey({ key: pemKey, format: "pem" });
  const signature = sign.sign(key).toString("base64url");
  return `${signingInput}.${signature}`;
}

/** Exchange a service-account JWT for a short-lived OAuth2 access token. */
async function getAccessToken(email, pemKey) {
  const jwt = buildJwt(email, pemKey);
  const res  = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    const detail = data.error_description ?? data.error ?? JSON.stringify(data);
    throw Object.assign(new Error(`Token exchange failed: ${detail}`), { isAuthError: true });
  }
  return data.access_token;
}

/** POST a single runReport request to the GA4 Data API. */
async function runReport(token, property, body) {
  const res = await fetch(`${GA4_BASE}/${property}:runReport`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg    = data.error?.message ?? JSON.stringify(data);
    // 403/401 = genuine permission error; 404 = wrong property ID (config error,
    // not a permission problem — don't surface it as "Permission denied").
    const isAuth = res.status === 403 || res.status === 401;
    throw Object.assign(new Error(msg), { isAuthError: isAuth, httpStatus: res.status });
  }
  return data;
}

// ── Row parsers ───────────────────────────────────────────────────────────────
const metricVal = (row, i) =>
  parseFloat(row.metricValues?.[i]?.value ?? "0");
const dimVal    = (row, i) =>
  row.dimensionValues?.[i]?.value ?? "";

// ── Main handler ──────────────────────────────────────────────────────────────

/** @param {import('express').Request} req @param {import('express').Response} res */
export default async function handler(req, res) {
  // ── Auth guard ───────────────────────────────────────────────────────────────
  const user = await verifyJwt(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // ── Credentials check ────────────────────────────────────────────────────────
  if (!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    return res.status(503).json({
      error:   "not_configured",
      message:
        "Google Analytics credentials are not yet set. " +
        "Add GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY " +
        "as environment variables.",
    });
  }

  // ── Parse query params ───────────────────────────────────────────────────────
  const rawDays   = req.query?.days ?? req.url?.split("days=")[1]?.split("&")[0];
  const days      = Math.min(Math.max(parseInt(rawDays ?? "30", 10), 1), 365);
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };
  const property  = `properties/${PROPERTY_ID}`;

  try {
    // Get a fresh access token (one JWT exchange per request)
    const token = await getAccessToken(CLIENT_EMAIL, PRIVATE_KEY);

    // Run all six reports in parallel
    const [
      summaryData,
      trendData,
      pagesData,
      sourcesData,
      countriesData,
      devicesData,
    ] = await Promise.all([
      // 1. Summary totals
      runReport(token, property, {
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

      // 2. Daily trend
      runReport(token, property, {
        dimensions:  [{ name: "date" }],
        metrics:     [{ name: "sessions" }, { name: "activeUsers" }],
        dateRanges:  [dateRange],
        orderBys:    [{ dimension: { dimensionName: "date" } }],
      }),

      // 3. Top pages
      runReport(token, property, {
        dimensions:  [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics:     [{ name: "screenPageViews" }, { name: "activeUsers" }],
        dateRanges:  [dateRange],
        orderBys:    [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit:       10,
      }),

      // 4. Traffic sources
      runReport(token, property, {
        dimensions:  [{ name: "sessionDefaultChannelGroup" }],
        metrics:     [{ name: "sessions" }],
        dateRanges:  [dateRange],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
      }),

      // 5. Countries
      runReport(token, property, {
        dimensions:  [{ name: "country" }],
        metrics:     [{ name: "sessions" }, { name: "activeUsers" }],
        dateRanges:  [dateRange],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       10,
      }),

      // 6. Device categories
      runReport(token, property, {
        dimensions:  [{ name: "deviceCategory" }],
        metrics:     [{ name: "sessions" }],
        dateRanges:  [dateRange],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    ]);

    // ── Shape the response ─────────────────────────────────────────────────────
    const sRow    = summaryData.rows?.[0];
    const summary = sRow
      ? {
          activeUsers:            Math.round(metricVal(sRow, 0)),
          totalUsers:             Math.round(metricVal(sRow, 1)),
          newUsers:               Math.round(metricVal(sRow, 2)),
          sessions:               Math.round(metricVal(sRow, 3)),
          pageViews:              Math.round(metricVal(sRow, 4)),
          bounceRate:             parseFloat((metricVal(sRow, 5) * 100).toFixed(1)),
          avgSessionDurationSecs: Math.round(metricVal(sRow, 6)),
        }
      : {
          activeUsers: 0, totalUsers: 0, newUsers: 0,
          sessions: 0, pageViews: 0, bounceRate: 0, avgSessionDurationSecs: 0,
        };

    const trend = (trendData.rows ?? []).map(row => ({
      date:     dimVal(row, 0).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      sessions: Math.round(metricVal(row, 0)),
      users:    Math.round(metricVal(row, 1)),
    }));

    const topPages = (pagesData.rows ?? []).map(row => ({
      path:  dimVal(row, 0),
      title: dimVal(row, 1),
      views: Math.round(metricVal(row, 0)),
      users: Math.round(metricVal(row, 1)),
    }));

    const sources = (sourcesData.rows ?? []).map(row => ({
      channel:  dimVal(row, 0),
      sessions: Math.round(metricVal(row, 0)),
    }));

    const countries = (countriesData.rows ?? []).map(row => ({
      country:  dimVal(row, 0),
      sessions: Math.round(metricVal(row, 0)),
      users:    Math.round(metricVal(row, 1)),
    }));

    const devices = (devicesData.rows ?? []).map(row => ({
      device:   dimVal(row, 0),
      sessions: Math.round(metricVal(row, 0)),
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
    console.error("[analytics] GA4 API error:", err?.message ?? err);

    const isAuth   = err?.isAuthError === true;
    const httpCode = err?.httpStatus;
    let message;
    if (isAuth) {
      message =
        "Permission denied — the service account does not have Viewer access " +
        "to this GA4 property, or the Analytics Data API is not enabled in Google Cloud.";
    } else if (httpCode === 404) {
      message =
        "GA4 property not found — check that GA4_PROPERTY_ID is the numeric " +
        "Property ID (e.g. 547340341), not the Measurement ID (G-XXXXXXXX).";
    } else {
      message = "Failed to fetch analytics data. Check server logs for details.";
    }
    return res.status(isAuth ? 403 : 500).json({
      error:   isAuth ? "auth_error" : "api_error",
      message,
      detail:  err?.message ?? String(err),
    });
  }
}
