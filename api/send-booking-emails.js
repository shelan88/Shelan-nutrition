/**
 * api/send-booking-emails.js
 *
 * Vercel Serverless Function  →  POST /api/send-booking-emails
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * After a booking is saved to Supabase:
 *   1. Verifies the appointment exists (prevents abuse as a spam relay).
 *   2. Sends a confirmation email to the client.
 *   3. Sends a notification email to the admin (if ADMIN_NOTIFICATION_EMAIL is set).
 *   4. Returns 200 { ok: true } only when the client email succeeds.
 *
 * Required env vars:
 *   RESEND_API_KEY               — Resend (resend.com) API key
 *   FROM_EMAIL                   — verified sender, e.g. "Shelan Nutrition <noreply@yourdomain.com>"
 *
 * Optional env vars:
 *   ADMIN_NOTIFICATION_EMAIL     — recipient for admin notifications
 */

import { adminClient }  from "./_lib/clients.js";
import { computePdfSig } from "./_lib/assessment-pdf.js";

// ── Fallback domain used when WEBSITE_URL env var is not set ─────────────────
// Defined once here so brandHeader() and clientEmailHtml() can't drift apart.
const DEFAULT_WEBSITE_URL = "https://shelancircle.com";

// ── Per-process deduplication for admin emails sent after assessment ──────────
// Prevents a double-send if the assessment wizard retries in the same process.
// (Long-running Express server on Replit.) For Vercel serverless the primary
// guard is the DB check below — assessment_status must equal 'assessment_submitted'.
const notifiedAppointments = new Set();

// ── Env vars are read inside the handler (not at module load) so that changes
// to Vercel / Replit env vars take effect on the next request without a
// full redeployment, and so the per-request diagnostic always reflects the
// live process environment.
function getEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL:     process.env.FROM_EMAIL ?? "Shelan Nutrition <noreply@shelancircle.com>",
    ADMIN_EMAIL:    process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL,
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
  console.log(`[send-booking-emails] → ${label} | to: ${payload.to.join(", ")} | from: ${FROM_EMAIL}`);

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
    console.error(`[send-booking-emails] ✗ ${label} | HTTP ${resp.status} | ${JSON.stringify(respBody)}`);
    throw new Error(`Resend ${resp.status}: ${respBody.message ?? JSON.stringify(respBody)}`);
  }
  console.log(`[send-booking-emails] ✓ ${label} | id: ${respBody.id ?? "unknown"} | ${JSON.stringify(respBody)}`);
  return respBody;
}

// ── Date formatter (works in both Node 18+ and browser) ──────────────────────

function formatDate(dateStr, lang) {
  try {
    const locale = lang === "ar" ? "ar-SA" : "en-US";
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Timezone abbreviation helper (Node 18+ Intl, no external deps) ──────────

function tzAbbrNode(tz, atDate = new Date()) {
  if (!tz) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
      hour: "numeric",
    }).formatToParts(atDate);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

// ── Shared: brand-header HTML block ──────────────────────────────────────────
// Renders the SHELAN logo header. gradientStart/End control direction so
// client and admin emails are visually distinct.
// Logo is served from ${WEBSITE_URL}/logo-email.png (12 KB optimised PNG).
// The "S" monogram text is kept as <img> alt-text fallback for image-blocked clients.

function brandHeader({ gradientStart, gradientEnd, eyebrow, title, isAr }) {
  const websiteUrl = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const logoSrc    = `${websiteUrl}/logo-email.png`;

  return `
    <!-- Brand header — bgcolor is Outlook fallback; gradient shows in modern clients -->
    <tr>
      <td align="center" bgcolor="${gradientStart}"
          style="background:linear-gradient(135deg,${gradientStart} 0%,${gradientEnd} 100%);
                 padding:36px 40px 28px;">

        <!-- Logo image (fallback: "S" monogram text shown when images are blocked) -->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 auto 14px;">
          <tr>
            <td align="center"
                style="background-color:#ffffff;border-radius:16px;
                       padding:8px 12px;display:inline-block;">
              <!--[if mso]>
              <table border="0" cellpadding="0" cellspacing="0"><tr><td width="200" style="background-color:#ffffff;padding:8px 12px;">
              <![endif]-->
              <img src="${logoSrc}"
                   alt="SHELAN"
                   width="200"
                   height="auto"
                   style="display:block;border:0;outline:none;text-decoration:none;
                          max-width:200px;height:auto;"
                   loading="eager">
              <!--[if mso]></td></tr></table><![endif]-->
            </td>
          </tr>
        </table>

        <!-- Subtitle — visible below logo; acts as second-level fallback copy -->
        <p style="margin:0 0 16px;font-family:Arial,'Helvetica Neue',sans-serif;
                  font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:2px;
                  text-align:center;text-transform:uppercase;">
          ${isAr ? "شيلان للتغذية" : "Nutrition &amp; Lipedema Care"}
        </p>

        <!-- Divider -->
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

// ── Email HTML: client confirmation ──────────────────────────────────────────

function clientEmailHtml({ clientName, service, date, time, lang, adminTz, visitorTz, visitorTime }) {
  const isAr          = lang === "ar";
  const dir           = isAr ? "rtl" : "ltr";
  const textAlign     = isAr ? "right" : "left";
  const formattedDate = formatDate(date, lang);

  // Resolve display time and timezone labels
  const refDate       = date ? new Date(`${date}T12:00:00Z`) : new Date();
  const visitorAbbr   = visitorTz  ? tzAbbrNode(visitorTz,  refDate) : "";
  const adminAbbr     = adminTz    ? tzAbbrNode(adminTz,    refDate) : "";
  // Prefer visitor's local time; fall back to stored admin-TZ time
  const primaryTime   = (visitorTime && visitorTime !== time) ? visitorTime : time;
  const primaryAbbr   = visitorAbbr || adminAbbr;
  // Show clinic reference time only when visitor is in a different TZ
  const showClinicRef = visitorTime && visitorTime !== time && adminAbbr && time;
  const clinicRef     = showClinicRef
    ? (isAr
        ? `${time}${adminAbbr ? ` (${adminAbbr})` : ""} — بتوقيت العيادة`
        : `${time}${adminAbbr ? ` (${adminAbbr})` : ""} — clinic time`)
    : null;
  const websiteUrl    = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const supportEmail  = process.env.SUPPORT_EMAIL
                     || process.env.ADMIN_NOTIFICATION_EMAIL
                     || "";

  // ── Copy
  const pageTitle   = isAr ? "تأكيد الحجز — شيلان" : "Booking Confirmed — SHELAN";
  const eyebrow     = isAr ? "تأكيد الحجز" : "BOOKING CONFIRMED";
  const headerTitle = isAr ? "تم تأكيد موعدكِ ✓" : "Your appointment is confirmed ✓";
  const greeting    = isAr
    ? `عزيزتي <strong style="color:#6a35b5;">${clientName}</strong>،`
    : `Dear <strong style="color:#6a35b5;">${clientName}</strong>,`;
  const intro       = isAr
    ? "يسعدنا إخباركِ بأن حجزكِ مع شيلان للتغذية قد تم تأكيده بنجاح. إليكِ ملخص جلستكِ القادمة:"
    : "We\u2019re delighted to confirm your upcoming session with Shelan Nutrition. Here is a summary of your appointment:";
  const lblSvc      = isAr ? "الخدمة"  : "Service";
  const lblDate     = isAr ? "التاريخ" : "Date";
  const lblTime     = isAr ? "الوقت"   : "Time";
  const closing1    = isAr
    ? "نتطلع إلى مرافقتكِ في رحلة الصحة والعافية."
    : "We look forward to supporting you on your health and wellness journey.";
  const closing2    = isAr
    ? "إذا كنتِ بحاجة إلى تعديل الموعد أو لديكِ أي استفسار، لا تترددي في التواصل معنا."
    : "If you need to reschedule or have any questions, please don\u2019t hesitate to reach out.";
  const ctaLabel    = isAr ? "زيارة الموقع" : "Visit Our Website";
  const footerBrand = isAr ? "شيلان للتغذية" : "SHELAN Nutrition";
  const footerSub   = isAr
    ? "استشارات تغذية متخصصة · إدارة الليبيديما"
    : "Personalized Nutrition \xb7 Lipedema Management";
  const footerAuto  = isAr
    ? "هذا البريد أُرسل تلقائياً — يُرجى عدم الرد عليه مباشرة."
    : "This email was sent automatically. Please do not reply directly.";
  const supportLine = supportEmail
    ? (isAr ? `للتواصل: <a href="mailto:${supportEmail}" style="color:#f35e98;text-decoration:none;">${supportEmail}</a>` : `Questions? <a href="mailto:${supportEmail}" style="color:#f35e98;text-decoration:none;">${supportEmail}</a>`)
    : "";

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

  <!-- Outer wrapper -->
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
              <p style="margin:0 0 28px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#7b6997;line-height:1.8;">${intro}</p>

              <!-- Booking details card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:28px;">

                <!-- Service row -->
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:16px 20px;border-bottom:1px solid #e8d5f5;
                             background-color:#f9f5ff;text-align:${textAlign};">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">${lblSvc}</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${service}</span>
                  </td>
                </tr>

                <!-- Date row -->
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:16px 20px;border-bottom:1px solid #e8d5f5;
                             background-color:#ffffff;text-align:${textAlign};">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">${lblDate}</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${formattedDate}</span>
                  </td>
                </tr>

                <!-- Time row -->
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:16px 20px;background-color:#f9f5ff;
                             text-align:${textAlign};">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">${lblTime}</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;"
                          dir="ltr">${primaryTime}${primaryAbbr ? ` <span style="font-size:12px;color:#9b87b8;font-weight:600;">(${primaryAbbr})</span>` : ""}</span>
                    ${clinicRef ? `<span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:11px;color:#b3a6c9;margin-top:3px;"
                          dir="ltr">${clinicRef}</span>` : ""}
                  </td>
                </tr>

              </table>
              <!-- End booking details card -->

              <!-- Closing copy -->
              <p style="margin:0 0 10px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#4a3566;line-height:1.8;">${closing1}</p>
              <p style="margin:0 0 28px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:14px;color:#7b6997;line-height:1.8;">${closing2}</p>

              <!-- CTA button -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="${isAr ? "margin-right:0;" : ""}">
                <tr>
                  <td bgcolor="#f35e98"
                      style="border-radius:50px;background-color:#f35e98;
                             box-shadow:0 4px 14px rgba(243,94,152,0.35);">
                    <a href="${websiteUrl}"
                       style="display:inline-block;padding:13px 32px;
                              font-family:Arial,'Helvetica Neue',sans-serif;
                              font-size:14px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:0.3px;"
                       target="_blank">${ctaLabel}</a>
                  </td>
                </tr>
              </table>

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

// ── Email HTML: admin notification ───────────────────────────────────────────

function adminEmailHtml({ clientName, clientEmail, phone, service, date, time, notes, adminTz, visitorTz, visitorTime, pdfUrl = null }) {
  const formattedDate = formatDate(date, "en");
  const refDate       = date ? new Date(`${date}T12:00:00Z`) : new Date();
  const adminAbbr     = adminTz  ? tzAbbrNode(adminTz,  refDate) : "";
  const visitorAbbr   = visitorTz ? tzAbbrNode(visitorTz, refDate) : "";
  const showClientTz  = visitorTime && visitorTime !== time && visitorAbbr;

  // WhatsApp link — strip non-digits from E.164 phone
  const waPhone = phone ? phone.replace(/\D/g, "") : "";
  const waHref  = waPhone ? `https://wa.me/${waPhone}` : "";

  // Escape user-supplied HTML in notes
  const safeNotes = notes
    ? notes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

  const header = brandHeader({
    gradientStart: "#f35e98",
    gradientEnd:   "#6a35b5",
    eyebrow:       "NEW BOOKING",
    title:         "A new session has been booked",
    isAr:          false,
  });

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Booking — ${clientName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .email-card{width:100%!important;border-radius:0!important;}
      .email-body{padding:24px 20px!important;}
      .wa-btn{display:block!important;text-align:center!important;}
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
            <td class="email-body" style="padding:36px 40px;background-color:#ffffff;">

              <!-- ── Client info card ── -->
              <p style="margin:0 0 12px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:10px;font-weight:700;color:#9b87b8;
                         text-transform:uppercase;letter-spacing:1.5px;">Client Details</p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:28px;">

                <!-- Name -->
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:16px 20px;border-bottom:1px solid #e8d5f5;
                             background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Name</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:16px;font-weight:700;color:#1c1033;">${clientName}</span>
                  </td>
                </tr>

                <!-- Email -->
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:16px 20px;border-bottom:1px solid #e8d5f5;
                             background-color:#ffffff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Email</span>
                    <a href="mailto:${clientEmail}"
                       style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;
                              font-weight:600;color:#f35e98;text-decoration:none;"
                    >${clientEmail}</a>
                  </td>
                </tr>

                ${phone ? `
                <!-- Phone + WhatsApp -->
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:16px 20px;background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:8px;">Phone</span>
                    <!-- Phone number + action buttons on same row -->
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                           style="width:100%;">
                      <tr>
                        <td style="vertical-align:middle;">
                          <a href="tel:${phone}"
                             style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;
                                    font-weight:600;color:#6a35b5;text-decoration:none;"
                             dir="ltr">${phone}</a>
                        </td>
                        ${waHref ? `
                        <td style="vertical-align:middle;text-align:right;padding-left:12px;">
                          <a class="wa-btn" href="${waHref}" target="_blank"
                             style="display:inline-block;padding:7px 16px;
                                    background-color:#25d366;border-radius:50px;
                                    font-family:Arial,'Helvetica Neue',sans-serif;
                                    font-size:12px;font-weight:700;color:#ffffff;
                                    text-decoration:none;white-space:nowrap;"
                          >&#128241; WhatsApp</a>
                        </td>` : ""}
                      </tr>
                    </table>
                  </td>
                </tr>` : ""}

              </table>
              <!-- End client info card -->

              <!-- ── Booking details card ── -->
              <p style="margin:0 0 12px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:10px;font-weight:700;color:#9b87b8;
                         text-transform:uppercase;letter-spacing:1.5px;">Booking Details</p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #e8d5f5;
                            margin-bottom:24px;">

                <!-- Service — highlighted -->
                <tr>
                  <td bgcolor="#6a35b5"
                      style="padding:16px 20px;background-color:#6a35b5;
                             border-bottom:1px solid rgba(255,255,255,0.15);">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Service</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#ffffff;">${service}</span>
                  </td>
                </tr>

                <!-- Date -->
                <tr>
                  <td bgcolor="#f9f5ff"
                      style="padding:16px 20px;border-bottom:1px solid #e8d5f5;
                             background-color:#f9f5ff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Date</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;">${formattedDate}</span>
                  </td>
                </tr>

                <!-- Time -->
                <tr>
                  <td bgcolor="#ffffff"
                      style="padding:16px 20px;${safeNotes ? "border-bottom:1px solid #e8d5f5;" : ""}
                             background-color:#ffffff;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Time</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:15px;font-weight:700;color:#1c1033;"
                          dir="ltr">${time}${adminAbbr ? ` <span style="font-size:12px;color:#9b87b8;font-weight:600;">(${adminAbbr})</span>` : ""}</span>
                    ${showClientTz ? `<span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:11px;color:#b3a6c9;margin-top:3px;"
                          dir="ltr">Client's local time: ${visitorTime} (${visitorAbbr})</span>` : ""}
                  </td>
                </tr>

                ${safeNotes ? `
                <!-- Notes -->
                <tr>
                  <td bgcolor="#fffaf0"
                      style="padding:16px 20px;background-color:#fffaf0;">
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:10px;font-weight:700;color:#9b87b8;
                                 text-transform:uppercase;letter-spacing:1px;
                                 margin-bottom:5px;">Notes</span>
                    <span style="display:block;font-family:Arial,'Helvetica Neue',sans-serif;
                                 font-size:14px;color:#4a3566;line-height:1.7;">${safeNotes}</span>
                  </td>
                </tr>` : ""}

              </table>
              <!-- End booking details card -->

              ${pdfUrl ? `
              <!-- ── Assessment download ── -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="border-radius:14px;overflow:hidden;border:1px solid #ddd5f0;
                            margin-bottom:24px;background-color:#f9f5ff;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:10px;font-weight:700;color:#9b87b8;
                               text-transform:uppercase;letter-spacing:1.5px;">Assessment Submitted</p>
                    <p style="margin:0 0 14px;font-family:Arial,'Helvetica Neue',sans-serif;
                               font-size:13px;color:#4a3566;line-height:1.5;">
                      The client has completed and submitted their questionnaire.
                    </p>
                    <a href="${pdfUrl}"
                       target="_blank"
                       style="display:inline-block;padding:12px 28px;
                              background:linear-gradient(135deg,#f35e98 0%,#6a35b5 100%);
                              border-radius:50px;font-family:Arial,'Helvetica Neue',sans-serif;
                              font-size:14px;font-weight:700;color:#ffffff;
                              text-decoration:none;direction:rtl;"
                    >&#128203; تحميل الاستبيان والإجابات PDF</a>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Auto-send note -->
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:12px;color:#b3a6c9;line-height:1.6;">
                This notification was sent automatically by Shelan Nutrition when a new booking was confirmed.
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

  // Body is parsed by Express (Replit) or Vercel's auto body-parser
  const {
    appointmentId,
    clientName,
    clientEmail,
    phone,
    service,
    date,
    time,
    notes,
    lang            = "en",
    adminTz         = null,    // IANA clinic timezone e.g. "America/Detroit"
    visitorTz       = null,    // IANA visitor browser timezone e.g. "Asia/Riyadh"
    visitorTime     = null,    // Pre-converted display time string in visitor's TZ
    assessmentPending = false, // When true: skip admin email (will be sent after assessment)
    adminOnly       = false,   // When true: skip client email; send admin email with PDF link
  } = req.body ?? {};

  // Log the exact body received so we can trace any data mismatch
  console.log("[send-booking-emails] body received:", JSON.stringify({
    appointmentId, clientName, clientEmail, service, date, time, lang,
    assessmentPending, adminOnly,
  }));

  const { RESEND_API_KEY, ADMIN_EMAIL } = getEnv();

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE: adminOnly — called after assessment submission.
  // Fetches all appointment data from the DB, verifies assessment is submitted,
  // then sends the ONE admin booking confirmation email with the PDF link.
  // Client email is NOT re-sent.
  // ═══════════════════════════════════════════════════════════════════════════
  if (adminOnly) {
    if (!appointmentId) {
      return res.status(400).json({ error: "Missing required field: appointmentId." });
    }

    // ── Deduplication: in-memory guard for same-process retries ─────────────
    if (notifiedAppointments.has(appointmentId)) {
      console.log(`[send-booking-emails] adminOnly dedup — already notified ${appointmentId}`);
      return res.status(200).json({ ok: true, dedup: true });
    }

    // ── Fetch full appointment data from DB (service-role, bypasses RLS) ────
    const { data: appt, error: apptErr } = await adminClient
      .from("appointments")
      .select("id, client_name, client_email, type, date, time, notes, assessment_status, assessment_response_id")
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) {
      console.error("[send-booking-emails] adminOnly — appointment lookup failed:", apptErr?.message);
      return res.status(404).json({ error: "Appointment not found." });
    }

    // ── Guard: only send when assessment is actually submitted ───────────────
    if (appt.assessment_status !== "assessment_submitted") {
      console.warn(`[send-booking-emails] adminOnly — assessment_status is '${appt.assessment_status}', not 'assessment_submitted'. Skipping.`);
      return res.status(200).json({ ok: false, reason: "Assessment not yet submitted." });
    }

    // ── Admin env diagnostic ─────────────────────────────────────────────────
    console.log(
      `[send-booking-emails] adminOnly env check | RESEND_API_KEY=${RESEND_API_KEY ? "SET" : "MISSING"} | ` +
      `ADMIN_EMAIL=${ADMIN_EMAIL || "MISSING"}`
    );

    if (!ADMIN_EMAIL) {
      console.warn("[send-booking-emails] adminOnly — ADMIN_EMAIL not set, skipping email.");
      return res.status(200).json({ ok: true, skipped: true });
    }

    // ── Fetch admin timezone from website_settings ───────────────────────────
    const { data: settings } = await adminClient
      .from("website_settings")
      .select("admin_tz")
      .limit(1)
      .maybeSingle();
    const apptAdminTz = settings?.admin_tz ?? null;

    // ── Build signed PDF URL ─────────────────────────────────────────────────
    let pdfUrl = null;
    try {
      const { WEBSITE_URL } = getEnv();
      const websiteBase = WEBSITE_URL || DEFAULT_WEBSITE_URL;
      const sig = computePdfSig(appointmentId);
      pdfUrl = `${websiteBase}/api/get-assessment-pdf?appointmentId=${encodeURIComponent(appointmentId)}&sig=${encodeURIComponent(sig)}`;
    } catch (sigErr) {
      // SESSION_SECRET not set — log warning but still send email without the link
      console.warn("[send-booking-emails] adminOnly — PDF URL generation failed:", sigErr.message);
    }

    // ── Send admin booking confirmation email (with assessment PDF link) ─────
    try {
      await sendEmail({
        to:      ADMIN_EMAIL,
        subject: `New Booking: ${appt.client_name} — ${appt.type}`,
        html:    adminEmailHtml({
          clientName:  appt.client_name,
          clientEmail: appt.client_email,
          phone:       null, // phone not stored on appointments row
          service:     appt.type,
          date:        appt.date,
          time:        appt.time,
          notes:       appt.notes ?? null,
          adminTz:     apptAdminTz,
          visitorTz:   null,
          visitorTime: null,
          pdfUrl,
        }),
        label: "admin-notification-with-assessment",
      });
      notifiedAppointments.add(appointmentId);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[send-booking-emails] adminOnly — admin email failed:", err.message);
      return res.status(500).json({ error: "Failed to send admin email. " + err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NORMAL FLOW (immediate post-payment): validate, send client email,
  // conditionally send admin email.
  // ═══════════════════════════════════════════════════════════════════════════

  if (!appointmentId || !clientEmail) {
    return res.status(400).json({ error: "Missing required fields: appointmentId, clientEmail." });
  }

  // ── Verify the appointment exists (prevents this being used as a spam relay)
  const { data: appt, error: apptErr } = await adminClient
    .from("appointments")
    .select("id")
    .eq("id", appointmentId)
    .single();

  if (apptErr || !appt) {
    console.error("[send-booking-emails] appointment lookup failed:", apptErr?.message);
    return res.status(404).json({ error: "Appointment not found." });
  }

  // ── Per-request env diagnostic ───────────────────────────────────────────────
  console.log(
    `[send-booking-emails] env check | RESEND_API_KEY=${RESEND_API_KEY ? "SET" : "MISSING"} | ` +
    `ADMIN_EMAIL=${ADMIN_EMAIL || "MISSING (ADMIN_NOTIFICATION_EMAIL not set)"}`
  );

  // ── Send client confirmation (required — failure blocks success response) ──
  try {
    await sendEmail({
      to:      clientEmail,
      subject: lang === "ar"
        ? "تأكيد الحجز — شيلان للتغذية"
        : "Booking Confirmed — Shelan Nutrition",
      html:    clientEmailHtml({ clientName, service, date, time, lang, adminTz, visitorTz, visitorTime }),
      label:   "client-confirmation",
    });
  } catch (err) {
    console.error("[send-booking-emails] ✗ client email failed:", err.message);
    return res.status(500).json({ error: "Failed to send confirmation email. " + err.message });
  }

  // ── When assessment is pending, skip admin email now (sent after submission) ─
  if (assessmentPending) {
    console.log("[send-booking-emails] assessmentPending=true — admin email deferred until assessment submitted.");
    return res.status(200).json({ ok: true });
  }

  // ── Send admin notification (optional — failure is logged but never blocks) ─
  if (ADMIN_EMAIL) {
    try {
      await sendEmail({
        to:      ADMIN_EMAIL,
        subject: `New Booking: ${clientName} — ${service}`,
        html:    adminEmailHtml({ clientName, clientEmail, phone, service, date, time, notes, adminTz, visitorTz, visitorTime }),
        label:   "admin-notification",
      });
    } catch (err) {
      console.error("[send-booking-emails] ✗ admin notification failed (non-fatal):", err.message);
    }
  } else {
    console.warn("[send-booking-emails] ⚠ admin notification skipped — ADMIN_NOTIFICATION_EMAIL is not set");
  }

  return res.status(200).json({ ok: true });
}
