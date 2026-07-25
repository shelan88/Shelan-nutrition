/**
 * api/_lib/auth.js
 *
 * Shared JWT verification helper.
 * Works with both Vercel IncomingMessage and Express Request objects —
 * both expose headers as a plain object keyed by lower-case header name.
 */

import { anonClient } from "./clients.js";

/**
 * Extract and verify the Bearer token from the Authorization header.
 * Returns the Supabase user on success, or null on failure.
 *
 * @param {{ headers: Record<string, string | string[] | undefined> }} req
 * @returns {Promise<import("@supabase/supabase-js").User | null>}
 */
export async function verifyJwt(req) {
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
