/**
 * api/send-questionnaire-reminder.js
 *
 * Vercel Serverless Function  →  POST /api/send-questionnaire-reminder
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Sends a reminder email to a client who hasn't yet completed their
 * post-booking questionnaire (assessment_status = 'awaiting_assessment').
 *
 * Required body fields:
 *   appointmentId  — UUID of the appointment
 *   clientName     — display name
 *   clientEmail    — recipient address
 *
 * Optional body fields:
 *   service        — service/session name shown in email
 *   date           — ISO date string "YYYY-MM-DD"
 *   lang           — "en" | "ar"  (default "en")
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   FROM_EMAIL
 *   WEBSITE_URL    — e.g. "https://shelancircle.com"
 */

import { adminClient } from "./_lib/clients.js";
import { verifyJwt }   from "./_lib/auth.js";

const DEFAULT_WEBSITE_URL = "https://shelancircle.com";

// ── Server-side cooldown guard ────────────────────────────────────────────────
// Prevents repeated sends across refreshes while task #18 (reminder_sent_at
// column) is not yet shipped.  Key: appointmentId → Unix ms of last send.
// Process-scoped; resets on deploy/restart, which is acceptable.
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const lastSentAt  = new Map(); // appointmentId → timestamp

function getEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL:     process.env.FROM_EMAIL ?? "Shelan Nutrition <noreply@shelancircle.com>",
  };
}

// ── Resend helper ─────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html, label }) {
  const { RESEND_API_KEY, FROM_EMAIL } = getEnv();
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not configured.");
  }
  const payload = {
    from:    FROM_EMAIL,
    to:      Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  console.log(`[send-questionnaire-reminder] → ${label} | to: ${payload.to.join(", ")}`);

  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  const respBody = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error(`[send-questionnaire-reminder] ✗ ${label} | HTTP ${resp.status} | ${JSON.stringify(respBody)}`);
    throw new Error(`Resend ${resp.status}: ${respBody.message ?? JSON.stringify(respBody)}`);
  }
  console.log(`[send-questionnaire-reminder] ✓ ${label} | id: ${respBody.id ?? "unknown"}`);
  return respBody;
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    const locale = lang === "ar" ? "ar-SA" : "en-US";
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Brand header (shared with send-booking-emails.js pattern) ─────────────────

function brandHeader({ gradientStart, gradientEnd, eyebrow, title, isAr }) {
  const websiteUrl = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const logoSrc    = `${websiteUrl}/logo-email.png`;

  return `
    <tr>
      <td align="center" bgcolor="${gradientStart}"
          style="background:linear-gradient(135deg,${gradientStart} 0%,${gradientEnd} 100%);
                 padding:36px 40px 28px;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 auto 14px;">
          <tr>
            <td align="center"
                style="background-color:#ffffff;border-radius:16px;
                       padding:8px 12px;display:inline-block;">
              <img src="${logoSrc}"
                   alt="SHELAN"
                   width="200"
                   height="auto"
                   style="display:block;border:0;outline:none;text-decoration:none;
                          max-width:200px;height:auto;"
                   loading="eager">
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;font-family:Arial,'Helvetica Neue',sans-serif;
                  font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:2px;
                  text-align:center;text-transform:uppercase;">
          ${isAr ? "شيلان للتغذية" : "Nutrition &amp; Lipedema Care"}
        </p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 auto 16px;">
          <tr>
            <td width="40" height="1" bgcolor="rgba(255,255,255,0.3)"
                style="background-color:rgba(255,255,255,0.3);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
        ${eyebrow ? `<p style="margin:0 0 6px;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:2px;
                               text-align:center;text-transform:uppercase;">${eyebrow}</p>` : ""}
        <h1 style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                   font-size:20px;font-weight:700;color:#ffffff;text-align:center;
                   line-height:1.3;">${title}</h1>
      </td>
    </tr>`;
}

// ── Reminder email HTML ───────────────────────────────────────────────────────

function reminderEmailHtml({ clientName, service, date, appointmentId, lang }) {
  const isAr          = lang === "ar";
  const dir           = isAr ? "rtl" : "ltr";
  const textAlign     = isAr ? "right" : "left";
  const formattedDate = formatDate(date, lang);
  const websiteUrl    = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const assessmentUrl = `${websiteUrl}/assessment/respond/${appointmentId}`;
  const supportEmail  = process.env.SUPPORT_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "";

  // Copy
  const pageTitle   = isAr ? "تذكير: إكمال الاستبيان — شيلان" : "Reminder: Complete Your Questionnaire — SHELAN";
  const eyebrow     = isAr ? "تذكير" : "ACTION REQUIRED";
  const headerTitle = isAr ? "استبيانكِ بانتظاركِ 📋" : "Your questionnaire is waiting 📋";
  const greeting    = isAr
    ? `عزيزتي <strong style="color:#6a35b5;">${clientName}</strong>،`
    : `Dear <strong style="color:#6a35b5;">${clientName}</strong>,`;
  const intro = isAr
    ? "لاحظنا أنكِ لم تُكملي بعد استبيان ما قبل الجلسة المرتبط بحجزكِ. يساعدنا هذا الاستبيان على تحضير جلستكِ بشكل أفضل وتقديم رعاية مخصصة لكِ."
    : "We noticed you haven't yet completed the pre-session questionnaire linked to your booking. This helps us prepare for your session and provide personalised care tailored to your needs.";
  const detail = isAr
    ? "يستغرق الاستبيان بضع دقائق فقط — يُرجى إكماله في أقرب وقت ممكن قبل موعدكِ."
    : "The questionnaire only takes a few minutes — please complete it as soon as possible before your appointment.";
  const ctaLabel    = isAr ? "إكمال الاستبيان الآن" : "Complete Questionnaire Now";
  const closing     = isAr
    ? "إذا كانت لديكِ أي أسئلة أو احتجتِ إلى مساعدة، لا تترددي في التواصل معنا."
    : "If you have any questions or need assistance, please don't hesitate to reach out.";
  const footerBrand = isAr ? "شيلان للتغذية" : "SHELAN Nutrition";
  const footerSub   = isAr
    ? "استشارات تغذية متخصصة · إدارة الليبيديما"
    : "Personalized Nutrition \xb7 Lipedema Management";
  const footerAuto  = isAr
    ? "هذا البريد أُرسل تلقائياً — يُرجى عدم الرد عليه مباشرة."
    : "This email was sent automatically. Please do not reply directly.";
  const supportLine = supportEmail
    ? (isAr
        ? `للتواصل: <a href="mailto:${supportEmail}" style="color:#f35e98;text-decoration:none;">${supportEmail}</a>`
        : `Questions? <a href="mailto:${supportEmail}" style="color:#f35e98;text-decoration:none;">${supportEmail}</a>`)
    : "";

  const lblSvc  = isAr ? "الخدمة"  : "Service";
  const lblDate = isAr ? "التاريخ" : "Date";

  const header = brandHeader({
    gradientStart: "#6a35b5",
    gradientEnd:   "#f35e98",
    eyebrow,
    title: headerTitle,
    isAr,
  });

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${pageTitle}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .email-card{width:100%!important;border-radius:0!important;}
      .email-body{padding:24px 20px!important;}
      .email-footer{padding:20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0ff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"
      bgcolor="#f5f0ff">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
         bgcolor="#f5f0ff" style="background-color:#f5f0ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card -->
        <table class="email-card" width="580" border="0" cellpadding="0" cellspacing="0"
               role="presentation"
               style="max-width:580px;width:100%;background-color:#ffffff;border-radius:20px;
                      overflow:hidden;box-shadow:0 8px 40px rgba(106,53,181,0.12);">

          ${header}

          <!-- Body -->
          <tr>
            <td class="email-body" dir="${dir}"
                style="padding:36px 40px;background-color:#ffffff;text-align:${textAlign};">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:16px;color:#1c1033;line-height:1.5;">${greeting}</p>
              <p style="margin:0 0 20px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#7b6997;line-height:1.8;">${intro}</p>

              ${(service || formattedDate) ? `
              <!-- Booking details card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:24px;">
                ${service ? `
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:14px 20px;border-bottom:${formattedDate ? "1px solid #e8d5f5" : "none"};
                             background-color:#f9f5ff;text-align:${textAlign};">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">${lblSvc}</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${service}</span>
                  </td>
                </tr>` : ""}
                ${formattedDate ? `
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:14px 20px;background-color:#ffffff;text-align:${textAlign};">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">${lblDate}</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${formattedDate}</span>
                  </td>
                </tr>` : ""}
              </table>` : ""}

              <!-- Detail copy -->
              <p style="margin:0 0 28px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#4a3566;line-height:1.8;">${detail}</p>

              <!-- CTA button -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:28px;">
                <tr>
                  <td bgcolor="#f35e98"
                      style="border-radius:50px;background-color:#f35e98;
                             box-shadow:0 4px 14px rgba(243,94,152,0.35);">
                    <a href="${assessmentUrl}"
                       style="display:inline-block;padding:14px 36px;
                              font-family:Arial,'Helvetica Neue',sans-serif;
                              font-size:15px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:0.3px;"
                       target="_blank">${ctaLabel}</a>
                  </td>
                </tr>
              </table>

              <!-- Closing copy -->
              <p style="margin:0 0 20px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#7b6997;line-height:1.8;">${closing}</p>

              <!-- Link fallback -->
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:11px;color:#b3a6c9;line-height:1.6;"
                 dir="ltr">
                ${isAr ? "رابط الاستبيان المباشر: " : "Direct link: "}
                <a href="${assessmentUrl}"
                   style="color:#9b87b8;text-decoration:underline;word-break:break-all;"
                >${assessmentUrl}</a>
              </p>

            </td>
          </tr>
          <!-- End body -->

          <!-- Footer -->
          <tr>
            <td class="email-footer" bgcolor="#f9f5ff"
                style="padding:24px 40px;background-color:#f9f5ff;
                       border-top:1px solid #e8d5f5;text-align:center;">
              <p style="margin:0 0 4px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:13px;font-weight:700;color:#6a35b5;">${footerBrand}</p>
              <p style="margin:0 0 10px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:11px;color:#9b87b8;">${footerSub}</p>
              ${supportLine
                ? `<p style="margin:0 0 10px;font-family:Arial,'Helvetica Neue',sans-serif;
                              font-size:12px;color:#7b6997;">${supportLine}</p>`
                : ""}
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:11px;color:#b3a6c9;">${footerAuto}</p>
            </td>
          </tr>

        </table>
        <!-- End card -->

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

  // 1. Authenticate — require a valid Supabase session
  const user = await verifyJwt(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized — valid admin session required." });
  }

  // 2. Authorise — caller must be an admin or staff member
  const { data: profile, error: profileErr } = await adminClient
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileErr || !profile || !["admin", "staff"].includes(profile.role)) {
    console.warn(`[send-questionnaire-reminder] forbidden | uid=${user.id} role=${profile?.role ?? "none"}`);
    return res.status(403).json({ error: "Forbidden — admin or staff role required." });
  }

  // 3. Validate input — only accept appointmentId and optional lang from client
  const { appointmentId, lang = "en" } = req.body ?? {};
  console.log("[send-questionnaire-reminder] request | uid:", user.id, "| appointmentId:", appointmentId);

  if (!appointmentId) {
    return res.status(400).json({ error: "Missing required field: appointmentId." });
  }

  // 4. Server-side cooldown guard (in-memory, 1-hour window per appointment)
  const lastSent = lastSentAt.get(appointmentId);
  if (lastSent && Date.now() - lastSent < COOLDOWN_MS) {
    const remainingMin = Math.ceil((COOLDOWN_MS - (Date.now() - lastSent)) / 60000);
    return res.status(429).json({
      error: `A reminder was already sent recently. Please wait ${remainingMin} minute(s) before resending.`,
    });
  }

  // 5. Fetch appointment data server-side — do NOT trust client-supplied fields
  const { data: appt, error: apptErr } = await adminClient
    .from("appointments")
    .select("id, client_name, client_email, type, date, assessment_status")
    .eq("id", appointmentId)
    .single();

  if (apptErr || !appt) {
    console.error("[send-questionnaire-reminder] appointment lookup failed:", apptErr?.message);
    return res.status(404).json({ error: "Appointment not found." });
  }

  // 6. Only send when assessment is exactly awaiting — reject any other state
  if (appt.assessment_status !== "awaiting_assessment") {
    return res.status(409).json({
      error: `Cannot send reminder: assessment_status is '${appt.assessment_status}', expected 'awaiting_assessment'.`,
    });
  }

  if (!appt.client_email) {
    return res.status(422).json({ error: "This appointment has no client email address on record." });
  }

  const { RESEND_API_KEY } = getEnv();
  console.log(`[send-questionnaire-reminder] env check | RESEND_API_KEY=${RESEND_API_KEY ? "SET" : "MISSING"}`);

  // 7. Send — all content derives from server-fetched appointment record
  try {
    await sendEmail({
      to:      appt.client_email,
      subject: lang === "ar"
        ? "تذكير: إكمال استبيان ما قبل الجلسة — شيلان للتغذية"
        : "Reminder: Please Complete Your Pre-Session Questionnaire — Shelan Nutrition",
      html: reminderEmailHtml({
        clientName:    appt.client_name ?? "",
        service:       appt.type        ?? "",
        date:          appt.date        ?? "",
        appointmentId: appt.id,
        lang,
      }),
      label: "questionnaire-reminder",
    });
  } catch (err) {
    console.error("[send-questionnaire-reminder] ✗ reminder email failed:", err.message);
    return res.status(500).json({ error: "Failed to send reminder email. " + err.message });
  }

  // 8. Record send time for cooldown enforcement
  lastSentAt.set(appointmentId, Date.now());
  console.log(`[send-questionnaire-reminder] ✓ reminder sent for appointment ${appointmentId}`);

  return res.status(200).json({ ok: true });
}
