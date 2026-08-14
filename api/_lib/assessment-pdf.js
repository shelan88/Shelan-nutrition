/**
 * api/_lib/assessment-pdf.js
 *
 * Shared helpers for the assessment PDF/report system.
 * Imported by both get-assessment-pdf.js and send-assessment-notification.js.
 *
 * Keeping the HMAC in one place ensures the signing and verification always
 * use the same algorithm — if one drifts, all links break immediately.
 */

import crypto from "node:crypto";

/**
 * Compute the HMAC-SHA256 signature for an assessment report URL.
 * The signature ties the link to exactly one appointmentId so that a link
 * for appointment A cannot be used to access appointment B's report.
 *
 * @param {string} appointmentId  — UUID of the appointment
 * @returns {string}              — hex-encoded HMAC signature
 * @throws  {Error}               — if SESSION_SECRET is not configured
 */
export function computePdfSig(appointmentId) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return crypto
    .createHmac("sha256", secret)
    .update("assessment-pdf-v1:" + appointmentId)
    .digest("hex");
}

/**
 * Constant-time comparison of two hex HMAC strings.
 * Prevents timing attacks that could allow an attacker to guess valid signatures.
 *
 * @returns {boolean}
 */
export function safeCompareSigs(a, b) {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
