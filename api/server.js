/**
 * api/server.js  —  Local Express server for Replit development.
 *
 * Imports the same handler functions that Vercel deploys as Serverless
 * Functions, wires them into Express, and starts a long-running listener.
 * Nothing is duplicated — all business logic lives in the individual
 * function files (api/delete-account.js, api/health.js).
 *
 * Vercel never executes this file; it reads api/delete-account.js and
 * api/health.js directly via its file-system function routing.
 */

import express from "express";
import deleteAccountHandler      from "./delete-account.js";
import healthHandler             from "./health.js";
import sendBookingEmailsHandler  from "./send-booking-emails.js";
import sitemapHandler            from "./sitemap.js";
import analyticsHandler          from "./analytics.js";
import debugAnalyticsHandler     from "./debug-analytics.js";
import createPaymentIntentHandler  from "./create-payment-intent.js";
import stripeWebhookHandler       from "./stripe-webhook.js";
import sendPasswordResetHandler            from "./send-password-reset.js";
import sendQuestionnaireReminderHandler   from "./send-questionnaire-reminder.js";
import getAssessmentPdfHandler            from "./get-assessment-pdf.js";
import sendAssessmentNotificationHandler  from "./send-assessment-notification.js";

const app = express();

// Stripe webhook needs the raw body for signature verification —
// mount it BEFORE the json() middleware.
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json());

// Wire handlers — method restriction is also enforced inside each handler,
// but Express's method-specific mounts provide an extra layer locally.
app.post("/api/delete-account",       deleteAccountHandler);
app.post("/api/send-booking-emails",  sendBookingEmailsHandler);
app.post("/api/create-payment-intent", createPaymentIntentHandler);
app.post("/api/send-password-reset",  sendPasswordResetHandler);
app.post("/api/send-questionnaire-reminder",   sendQuestionnaireReminderHandler);
app.get("/api/get-assessment-pdf",            getAssessmentPdfHandler);
app.post("/api/send-assessment-notification", sendAssessmentNotificationHandler);
app.get("/api/health",                        healthHandler);
app.get("/api/analytics",             analyticsHandler);
app.get("/api/debug-analytics",       debugAnalyticsHandler);
app.get("/sitemap.xml",               sitemapHandler);

const PORT = process.env.API_PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[api] Server listening on port ${PORT}`);
});
