/**
 * src/lib/stripe.ts
 *
 * Shared Stripe helpers for the frontend.
 * - `stripePromise` — lazily-loaded Stripe.js instance (pass to <Elements>)
 * - `parsePriceCents` — converts a price string like "$65" → 6500
 */

import { loadStripe } from "@stripe/stripe-js";

/** Lazily-loaded Stripe instance. Pass to `<Elements stripe={stripePromise}>`. */
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
);

/**
 * Parse a human-readable price string into Stripe's smallest currency unit.
 *
 * Examples:
 *   "$65"    → 6500
 *   "$350"   → 35000
 *   "KWD 15" → 1500
 *   "€99.99" → 9999
 *
 * Falls back to 0 if no numeric value is found.
 */
export function parsePriceCents(price: string): number {
  const match = price.match(/[\d]+(?:[.,]\d+)?/);
  if (!match) return 0;
  const normalized = match[0].replace(",", ".");
  const amount = parseFloat(normalized);
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}
