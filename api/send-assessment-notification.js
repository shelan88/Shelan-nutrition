/**
 * api/send-assessment-notification.js
 *
 * Vercel Serverless Function  →  POST /api/send-assessment-notification
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Called (fire-and-forget) by the public assessment wizard immediately after a
 * customer submits their questionnaire.  Sends the admin a branded notification
 * email containing a secure, signed link to view and print the completed
 * assessment report.
 *
 * Security notes:
 *   - All booking and response data is fetched server-side using the
 *     service-role adminClient.  Nothing from the request body is used for
 *     data access beyond the appointmentId / responseId (which are then
 *     cross-verified in the DB before any email is sent).
 *   - The report link carries an HMAC-SHA256 signature so that only the
 *     recipient with the original link can access that appointment's report.
 *   - An in-memory set deduplicates sends within the same process lifetime.
 *
 * Required env vars:
 *   RESEND_API_KEY, FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL (or ADMIN_EMAIL)
 *   SESSION_SECRET, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { adminClient }   from "./_lib/clients.js";
import { computePdfSig } from "./_lib/assessment-pdf.js";

const DEFAULT_WEBSITE_URL = "https://shelancircle.com";

// ── Deduplication guard (process-scoped in-memory set) ───────────────────────
// Prevents the same appointment's notification being sent twice if the wizard
// fires the request more than once (e.g. double-tap).
const notifiedAppointments = new Set();

// ── Env ───────────────────────────────────────────────────────────────────────
function getEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL:     process.env.FROM_EMAIL ?? "Shelan Nutrition <noreply@shelancircle.com>",
    ADMIN_EMAIL:    process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL,
    WEBSITE_URL:    process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL,
  };
}

// ── Resend helper (same pattern as other API handlers) ────────────────────────
async function sendEmail({ to, subject, html, label }) {
  const { RESEND_API_KEY, FROM_EMAIL } = getEnv();
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");

  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Resend ${resp.status}: ${body.message ?? JSON.stringify(body)}`);
  }
  console.log(`[send-assessment-notification] ✓ ${label} | id: ${body.id ?? "unknown"}`);
  return body;
}

// ── Date/time helpers ─────────────────────────────────────────────────────────
function formatDateLong(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch { return dateStr; }
}

function formatDateTimeUTC(isoStr) {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString("en-US", {
      dateStyle: "long", timeStyle: "short", timeZone: "UTC",
    }) + " (UTC)";
  } catch { return isoStr; }
}

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Admin email HTML ──────────────────────────────────────────────────────────

function buildAdminEmailHtml({ clientName, clientEmail, service, date, time, submittedAt, reportUrl }) {
  const formattedDate  = esc(formatDateLong(date));
  const formattedSubmit = esc(formatDateTimeUTC(submittedAt));
  const safeClient     = esc(clientName);
  const safeEmail      = esc(clientEmail);
  const safeService    = esc(service);
  const safeTime       = esc(time ?? "—");
  const safeReportUrl  = esc(reportUrl);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Assessment Submitted: ${safeClient}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .email-card{width:100%!important;border-radius:0!important;}
      .email-body{padding:24px 20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0ff;-webkit-text-size-adjust:100%;" bgcolor="#f5f0ff">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
         bgcolor="#f5f0ff" style="background-color:#f5f0ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table class="email-card" width="580" border="0" cellpadding="0" cellspacing="0"
               role="presentation"
               style="max-width:580px;width:100%;background-color:#ffffff;border-radius:20px;
                      overflow:hidden;box-shadow:0 8px 40px rgba(106,53,181,0.12);">

          <!-- Brand header -->
          <tr>
            <td align="center" bgcolor="#6a35b5"
                style="background:linear-gradient(135deg,#6a35b5 0%,#f35e98 100%);
                       padding:32px 40px 24px;">
              <p style="margin:0 0 6px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:2px;
                         text-transform:uppercase;">ASSESSMENT SUBMITTED</p>
              <h1 style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                &#128203; Questionnaire Completed
              </h1>
              <p style="margin:8px 0 0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:13px;color:rgba(255,255,255,0.8);">
                A client has submitted their pre-session questionnaire
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding:36px 40px;background-color:#ffffff;">

              <!-- Client Details -->
              <p style="margin:0 0 12px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:10px;font-weight:700;color:#9b87b8;
                         text-transform:uppercase;letter-spacing:1.5px;">Client Details</p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:24px;">
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:14px 20px;border-bottom:1px solid #e8d5f5;background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Name</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${safeClient}</span>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:14px 20px;background-color:#ffffff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Email</span>
                    <a href="mailto:${safeEmail}"
                       style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;
                              font-weight:600;color:#f35e98;text-decoration:none;">${safeEmail}</a>
                  </td>
                </tr>
              </table>

              <!-- Booking Details -->
              <p style="margin:0 0 12px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:10px;font-weight:700;color:#9b87b8;
                         text-transform:uppercase;letter-spacing:1.5px;">Booking Details</p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:28px;">
                <tr>
                  <td bgcolor="#6a35b5"
                      style="padding:14px 20px;background-color:#6a35b5;
                             border-bottom:1px solid rgba(255,255,255,0.15);">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Service</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:14px;font-weight:700;color:#ffffff;">${safeService}</span>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:14px 20px;border-bottom:1px solid #e8d5f5;background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Date</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:14px;font-weight:700;color:#1c1033;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:14px 20px;border-bottom:1px solid #e8d5f5;background-color:#ffffff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Time</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:14px;font-weight:700;color:#1c1033;" dir="ltr">${safeTime}</span>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:14px 20px;background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Assessment Submitted</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:13px;font-weight:600;color:#1c1033;">${formattedSubmit}</span>
                  </td>
                </tr>
              </table>

              <!-- Assessment download section -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:2px solid #6a35b5;
                            margin-bottom:28px;">
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:20px 24px;background-color:#f9f5ff;">
                    <p style="margin:0 0 4px;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:10px;font-weight:700;color:#9b87b8;
                               text-transform:uppercase;letter-spacing:1.5px;">&#128203; استبيان العميلة</p>
                    <p style="margin:0 0 16px;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:14px;color:#4a3566;line-height:1.6;">
                      The client's completed questionnaire is ready.
                      Click below to view all questions and answers,
                      then use <strong>Print &rarr; Save as PDF</strong> to download.
                    </p>
                    <!-- CTA button -->
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td bgcolor="#6a35b5"
                            style="border-radius:50px;background-color:#6a35b5;
                                   box-shadow:0 4px 14px rgba(106,53,181,0.35);">
                          <a href="${safeReportUrl}"
                             style="display:inline-block;padding:14px 28px;
                                    font-family:Arial,'Helvetica Neue',sans-serif;
                                    font-size:14px;font-weight:700;color:#ffffff;
                                    text-decoration:none;letter-spacing:0.3px;"
                             target="_blank">
                            &#128203; تحميل الاستبيان والإجابات PDF
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:11px;color:#b3a6c9;">
                      This link is unique to this client. Do not share publicly.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Auto-send note -->
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:12px;color:#b3a6c9;line-height:1.6;">
                This notification was sent automatically by Shelan Nutrition when a client completed their questionnaire.
              </p>

            </td>
          </tr>
          <!-- End body -->

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9f5ff"
                style="padding:20px 40px;background-color:#f9f5ff;
                       border-top:1px solid #e8d5f5;text-align:center;">
              <p style="margin:0 0 4px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:13px;font-weight:700;color:#6a35b5;">SHELAN Nutrition</p>
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:11px;color:#b3a6c9;">Admin Notification System</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { appointmentId, responseId } = req.body ?? {};

  if (!appointmentId || !responseId) {
    return res.status(400).json({ error: "Missing required fields: appointmentId, responseId." });
  }

  console.log(`[send-assessment-notification] received | appointmentId=${appointmentId} | responseId=${responseId}`);

  // ── Deduplication guard ─────────────────────────────────────────────────────
  if (notifiedAppointments.has(appointmentId)) {
    console.log(`[send-assessment-notification] already notified — skipping duplicate for ${appointmentId}`);
    return res.status(200).json({ ok: true, skipped: "duplicate" });
  }

  // ── Verify appointment and response server-side (never trust request body for data) ─
  const { data: appt, error: apptErr } = await adminClient
    .from("appointments")
    .select("id, client_name, client_email, type, date, time, assessment_response_id, assessment_status")
    .eq("id", appointmentId)
    .single();

  if (apptErr || !appt) {
    console.error("[send-assessment-notification] appointment not found:", apptErr?.message);
    // Return 200 — this is a non-critical background task; we don't want to
    // error the frontend if the appointment lookup fails.
    return res.status(200).json({ ok: false, error: "Appointment not found." });
  }

  // Verify the response belongs to this appointment (canonical link on appointments row)
  if (appt.assessment_response_id !== responseId) {
    console.warn(
      `[send-assessment-notification] responseId mismatch | expected=${appt.assessment_response_id} | got=${responseId}`
    );
    return res.status(200).json({ ok: false, error: "Response does not match appointment." });
  }

  // Verify response is truly submitted
  const { data: response, error: respErr } = await adminClient
    .from("assessment_responses")
    .select("id, status, submitted_at, appointment_id")
    .eq("id", responseId)
    .eq("status", "submitted")
    .single();

  if (respErr || !response) {
    console.warn(`[send-assessment-notification] response not submitted yet for ${responseId}`);
    return res.status(200).json({ ok: false, error: "Assessment not yet submitted." });
  }

  // Double-check the response really belongs to this appointment
  if (response.appointment_id !== appointmentId) {
    console.error("[send-assessment-notification] response.appointment_id mismatch — security check failed");
    return res.status(200).json({ ok: false, error: "Security check failed." });
  }

  const { ADMIN_EMAIL, WEBSITE_URL } = getEnv();

  if (!ADMIN_EMAIL) {
    console.warn("[send-assessment-notification] ADMIN_NOTIFICATION_EMAIL not configured — skipping.");
    return res.status(200).json({ ok: true, skipped: "no-admin-email" });
  }

  // ── Build signed report URL ─────────────────────────────────────────────────
  let sig;
  try {
    sig = computePdfSig(appointmentId);
  } catch (e) {
    console.error("[send-assessment-notification] could not compute sig:", e.message);
    return res.status(200).json({ ok: false, error: "SESSION_SECRET not configured." });
  }

  const reportUrl = `${WEBSITE_URL}/api/get-assessment-pdf?appointmentId=${encodeURIComponent(appointmentId)}&sig=${sig}`;

  // ── Send admin email ────────────────────────────────────────────────────────
  try {
    await sendEmail({
      to:      ADMIN_EMAIL,
      subject: `Assessment Submitted: ${appt.client_name ?? "Client"} — ${appt.type ?? "Booking"}`,
      html:    buildAdminEmailHtml({
        clientName:  appt.client_name  ?? "Client",
        clientEmail: appt.client_email ?? "—",
        service:     appt.type         ?? "—",
        date:        appt.date         ?? null,
        time:        appt.time         ?? null,
        submittedAt: response.submitted_at,
        reportUrl,
      }),
      label: "assessment-notification",
    });

    notifiedAppointments.add(appointmentId);
    console.log(`[send-assessment-notification] ✓ sent for appointment ${appointmentId}`);
  } catch (err) {
    console.error("[send-assessment-notification] ✗ email failed (non-fatal):", err.message);
    // Non-fatal — the assessment is already saved; the email is secondary.
    return res.status(200).json({ ok: false, error: "Email send failed: " + err.message });
  }

  return res.status(200).json({ ok: true });
}
