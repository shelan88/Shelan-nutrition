/**
 * api/create-payment-intent.js
 *
 * Creates a Stripe PaymentIntent server-side and returns the client_secret
 * to the browser. The browser then uses stripe.confirmCardPayment() to
 * complete the charge without the secret key ever touching the client.
 *
 * POST /api/create-payment-intent
 * Body: { amount: number (cents), currency?: string, metadata?: object }
 */

import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Stripe is not configured on this server." });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });

  const { amount, currency = "usd", metadata = {} } = req.body ?? {};

  if (typeof amount !== "number" || amount < 50) {
    return res.status(400).json({ error: "Invalid amount. Must be a number ≥ 50 (cents)." });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return res.status(200).json({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("[create-payment-intent] Stripe error:", err.message);
    return res.status(500).json({ error: err.message ?? "Failed to create payment intent." });
  }
}
