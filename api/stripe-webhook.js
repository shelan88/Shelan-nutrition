/**
 * api/stripe-webhook.js
 *
 * Receives signed Stripe webhook events and updates payment status in
 * Supabase. This is the authoritative source of truth for payment status —
 * it fires even when the browser tab closes before the frontend can record.
 *
 * POST /api/stripe-webhook  (raw body required for signature verification)
 *
 * Configure your Stripe dashboard to point the webhook at:
 *   https://<your-domain>/api/stripe-webhook
 * with event: payment_intent.succeeded, payment_intent.payment_failed
 */

import Stripe from "stripe";
import { adminClient } from "./_lib/clients.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecretKey   = process.env.STRIPE_SECRET_KEY;
  const webhookSecret     = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Stripe not configured." });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });

  // Verify signature if webhook secret is set
  let event;
  if (webhookSecret) {
    const sig = req.headers["stripe-signature"];
    // req.body is a raw Buffer when using express.raw() (see server.js)
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } else {
    // No secret configured — accept unverified (development only)
    event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const pi = event?.data?.object;

  switch (event?.type) {
    case "payment_intent.succeeded": {
      await adminClient
        .from("payments")
        .upsert(
          {
            stripe_payment_intent_id: pi.id,
            amount:                   pi.amount,
            currency:                 pi.currency,
            status:                   "succeeded",
            metadata:                 pi.metadata ?? {},
            updated_at:               new Date().toISOString(),
          },
          { onConflict: "stripe_payment_intent_id", ignoreDuplicates: false },
        );
      console.log("[stripe-webhook] payment_intent.succeeded:", pi.id);
      break;
    }

    case "payment_intent.payment_failed": {
      await adminClient
        .from("payments")
        .upsert(
          {
            stripe_payment_intent_id: pi.id,
            amount:                   pi.amount,
            currency:                 pi.currency,
            status:                   "failed",
            metadata:                 pi.metadata ?? {},
            updated_at:               new Date().toISOString(),
          },
          { onConflict: "stripe_payment_intent_id", ignoreDuplicates: false },
        );
      console.log("[stripe-webhook] payment_intent.payment_failed:", pi.id);
      break;
    }

    default:
      // Ignore other event types
      break;
  }

  return res.status(200).json({ received: true });
}
