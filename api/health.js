/**
 * api/health.js
 *
 * Vercel Serverless Function  →  GET /api/health
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Simple liveness check — returns { ok: true } for any GET request.
 */

export default function handler(_req, res) {
  res.status(200).json({ ok: true });
}
