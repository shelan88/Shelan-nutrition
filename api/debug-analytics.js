/**
 * api/debug-analytics.js — TEMPORARY credential-inspection endpoint.
 *
 * GET /api/debug-analytics
 *
 * Requires a valid admin JWT (same guard as /api/analytics).
 * Returns credential metadata WITHOUT exposing the private key:
 *   - GA4_PROPERTY_ID (exact value loaded by this process)
 *   - GOOGLE_CLIENT_EMAIL (exact value)
 *   - Google Cloud project ID (derived from the email)
 *   - Private-key metadata: parseable, type, byte-length, header line
 *   - Live token-exchange result (success / error from Google OAuth2)
 *   - Live GA4 runReport result for the loaded property (HTTP status + error)
 *
 * DELETE THIS FILE once the Vercel mismatch is resolved.
 */

import { createSign, createPrivateKey } from "crypto";
import { verifyJwt } from "./_lib/auth.js";

const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

export default async function handler(req, res) {
  // ── Auth guard (same as /api/analytics) ────────────────────────────────────
  const user = await verifyJwt(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // ── Read env vars exactly as analytics.js does ─────────────────────────────
  const rawPropertyId  = process.env.GA4_PROPERTY_ID;
  const rawEmail       = process.env.GOOGLE_CLIENT_EMAIL;
  const rawPrivateKey  = process.env.GOOGLE_PRIVATE_KEY;

  // Normalise the key the same way analytics.js does
  const normalizedKey = rawPrivateKey
    ?.replace(/^"|"$/g, "")
    ?.replace(/\\n/g, "\n");

  // ── Credential presence ────────────────────────────────────────────────────
  const presence = {
    GA4_PROPERTY_ID:    rawPropertyId   ? "set"     : "MISSING",
    GOOGLE_CLIENT_EMAIL: rawEmail       ? "set"     : "MISSING",
    GOOGLE_PRIVATE_KEY:  rawPrivateKey  ? "set"     : "MISSING",
  };

  // ── Property ID shape check ────────────────────────────────────────────────
  const propertyIdValue   = rawPropertyId ?? "(not set)";
  const looksLikeNumeric  = /^\d+$/.test(rawPropertyId ?? "");
  const looksLikeMeasurement = /^G-/i.test(rawPropertyId ?? "");

  // ── Email / project metadata ───────────────────────────────────────────────
  const emailValue = rawEmail ?? "(not set)";
  const saMatch    = emailValue.match(/^([^@]+)@([^.]+)\.iam\.gserviceaccount\.com$/);
  const projectId  = saMatch ? saMatch[2] : "(email is not a service-account address)";
  const saName     = saMatch ? saMatch[1] : null;

  // ── Private-key metadata (NO key material exposed) ─────────────────────────
  let keyMeta = {};
  try {
    const keyObj   = createPrivateKey({ key: normalizedKey, format: "pem" });
    const lines    = (normalizedKey ?? "").split("\n").filter(Boolean);
    keyMeta = {
      parseable:    true,
      keyType:      keyObj.asymmetricKeyType,        // "rsa"
      keySize:      keyObj.asymmetricKeyDetails?.modulusLength ?? null,
      rawByteLen:   Buffer.byteLength(normalizedKey ?? ""),
      headerLine:   lines[0]   ?? "(empty)",
      trailerLine:  lines[lines.length - 1] ?? "(empty)",
      lineCount:    lines.length,
      // Whether the key still has literal \n (i.e. normalisation failed)
      hasLiteralBackslashN: (normalizedKey ?? "").includes("\\n"),
    };
  } catch (e) {
    keyMeta = { parseable: false, parseError: e.message };
  }

  // ── Live OAuth2 token-exchange test ────────────────────────────────────────
  let tokenTest = {};
  if (keyMeta.parseable && rawEmail && rawPropertyId) {
    try {
      const now    = Math.floor(Date.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({
        iss:   rawEmail,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud:   "https://oauth2.googleapis.com/token",
        exp:   now + 3600,
        iat:   now,
      })).toString("base64url");
      const input     = `${header}.${payload}`;
      const sign      = createSign("SHA256");
      sign.update(input); sign.end();
      const keyObj    = createPrivateKey({ key: normalizedKey, format: "pem" });
      const signature = sign.sign(keyObj).toString("base64url");
      const jwt       = `${input}.${signature}`;

      const tokenRes  = await fetch("https://oauth2.googleapis.com/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion:  jwt,
        }),
      });
      const tokenData = await tokenRes.json();

      if (tokenRes.ok && tokenData.access_token) {
        tokenTest = {
          success:     true,
          httpStatus:  tokenRes.status,
          tokenLength: tokenData.access_token.length,
          tokenType:   tokenData.token_type ?? "Bearer",
        };

        // ── Live GA4 runReport test ───────────────────────────────────────
        const ga4Res = await fetch(
          `${GA4_BASE}/properties/${rawPropertyId}:runReport`,
          {
            method:  "POST",
            headers: {
              Authorization:  `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              metrics:    [{ name: "activeUsers" }],
              dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            }),
          },
        );
        const ga4Data = await ga4Res.json();
        tokenTest.ga4Report = {
          httpStatus: ga4Res.status,
          ok:         ga4Res.ok,
          rows:       ga4Data.rows?.length ?? (ga4Res.ok ? 0 : null),
          error:      ga4Res.ok ? null : (ga4Data.error?.message ?? JSON.stringify(ga4Data)),
          errorCode:  ga4Res.ok ? null : ga4Data.error?.code,
          errorStatus: ga4Res.ok ? null : ga4Data.error?.status,
        };
      } else {
        tokenTest = {
          success:    false,
          httpStatus: tokenRes.status,
          error:      tokenData.error_description ?? tokenData.error ?? JSON.stringify(tokenData),
        };
      }
    } catch (e) {
      tokenTest = { success: false, exception: e.message };
    }
  } else {
    tokenTest = { skipped: true, reason: "Missing credentials or un-parseable key" };
  }

  // ── Compose response ───────────────────────────────────────────────────────
  return res.status(200).json({
    environment:   process.env.VERCEL ? "vercel" : (process.env.REPL_ID ? "replit" : "unknown"),
    nodeVersion:   process.version,
    credentials: {
      presence,
      propertyId: {
        value:              propertyIdValue,
        looksNumeric:       looksLikeNumeric,
        looksLikeMeasurementId: looksLikeMeasurement,
        warning: looksLikeMeasurement
          ? "This looks like a Measurement ID (G-XXXXXXXX). Must be the numeric Property ID instead."
          : looksLikeNumeric ? null : "Value is not a plain integer — double-check.",
      },
      email: {
        value:     emailValue,
        projectId,
        saName,
        isServiceAccount: !!saMatch,
      },
      privateKey: keyMeta,
    },
    tokenExchange: tokenTest,
  });
}
