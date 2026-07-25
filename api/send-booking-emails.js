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

import { adminClient } from "./_lib/clients.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL ?? "Shelan Nutrition <noreply@shilan.com>";
const ADMIN_EMAIL    = process.env.ADMIN_NOTIFICATION_EMAIL;

// ── Resend helper ─────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not configured.");
  }
  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(`Resend ${resp.status}: ${body.message ?? JSON.stringify(body)}`);
  }
  return resp.json();
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

// ── Email HTML: client confirmation ──────────────────────────────────────────

function clientEmailHtml({ clientName, service, date, time, lang }) {
  const isAr = lang === "ar";
  const dir  = isAr ? "rtl" : "ltr";
  const formattedDate = formatDate(date, lang);

  const heading   = isAr ? "تم تأكيد حجزكِ ✓"   : "Booking Confirmed ✓";
  const greeting  = isAr ? `عزيزتي <strong>${clientName}</strong>،` : `Dear <strong>${clientName}</strong>,`;
  const intro     = isAr
    ? "تم تأكيد موعدكِ مع شيلان للتغذية. إليكِ تفاصيل الجلسة:"
    : "Your session with Shelan Nutrition is confirmed. Here are your booking details:";
  const lblSvc    = isAr ? "الخدمة"   : "Service";
  const lblDate   = isAr ? "التاريخ"  : "Date";
  const lblTime   = isAr ? "الوقت"    : "Time";
  const closing   = isAr
    ? "نتطلع إلى لقائكِ! إذا كنتِ بحاجة إلى إعادة الجدولة، يرجى التواصل معنا مباشرة."
    : "We look forward to seeing you! If you need to reschedule or have any questions, please contact us directly.";
  const footer    = isAr ? "شيلان للتغذية · استشارات تغذية متخصصة" : "Shelan Nutrition · Professional Nutrition Consultation";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f9f5ff;font-family:Arial,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9f5ff;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:520px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(180,100,160,.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#e8a4c4 0%,#b8a0d8 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-.3px;">${heading}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;" dir="${dir}">
            <p style="margin:0 0 8px;font-size:15px;color:#2d1b4e;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b6b8a;line-height:1.7;">${intro}</p>

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#f9f5ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">${lblSvc}</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;">${service}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">${lblDate}</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">${lblTime}</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;" dir="ltr">${time}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#6b6b8a;line-height:1.7;">${closing}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f5ff;padding:20px 40px;text-align:center;border-top:1px solid #e8e0f5;">
            <p style="margin:0;font-size:12px;color:#9b87b8;">${footer}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email HTML: admin notification ───────────────────────────────────────────

function adminEmailHtml({ clientName, clientEmail, phone, service, date, time, notes }) {
  const formattedDate = formatDate(date, "en");
  const notesRow = notes
    ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
         <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Notes</span><br>
         <span style="font-size:14px;color:#2d1b4e;">${notes.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Booking — ${clientName}</title>
</head>
<body style="margin:0;padding:0;background:#f9f5ff;font-family:Arial,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9f5ff;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(180,100,160,.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#b8a0d8 0%,#e8a4c4 100%);padding:24px 40px;">
            <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">📋 New Booking Received</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:14px;color:#6b6b8a;">A new session has been booked. Details below:</p>

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#f9f5ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Client</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;">${clientName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Email</span><br>
                  <a href="mailto:${clientEmail}" style="font-size:14px;color:#c4608c;text-decoration:none;">${clientEmail}</a>
                </td>
              </tr>
              ${phone ? `<tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Phone</span><br>
                  <span style="font-size:14px;color:#2d1b4e;" dir="ltr">${phone}</span>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Service</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;">${service}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e8e0f5;">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Date</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;${notes ? "border-bottom:1px solid #e8e0f5;" : ""}">
                  <span style="font-size:11px;color:#9b87b8;text-transform:uppercase;letter-spacing:.5px;">Time</span><br>
                  <span style="font-size:15px;font-weight:600;color:#2d1b4e;" dir="ltr">${time}</span>
                </td>
              </tr>
              ${notesRow}
            </table>

            <p style="margin:0;font-size:13px;color:#9b87b8;">This notification was sent automatically from Shelan Nutrition.</p>
          </td>
        </tr>

      </table>
    </td></tr>
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
    lang = "en",
  } = req.body ?? {};

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

  // ── Send client confirmation (required — failure blocks success response) ──
  try {
    await sendEmail({
      to:      clientEmail,
      subject: lang === "ar"
        ? "تأكيد الحجز — شيلان للتغذية"
        : "Booking Confirmed — Shelan Nutrition",
      html:    clientEmailHtml({ clientName, service, date, time, lang }),
    });
    console.log(`[send-booking-emails] confirmation sent → ${clientEmail}`);
  } catch (err) {
    console.error("[send-booking-emails] client email failed:", err.message);
    return res.status(500).json({ error: "Failed to send confirmation email. " + err.message });
  }

  // ── Send admin notification (optional — failure is logged but ignored) ──────
  if (ADMIN_EMAIL) {
    try {
      await sendEmail({
        to:      ADMIN_EMAIL,
        subject: `New Booking: ${clientName} — ${service}`,
        html:    adminEmailHtml({ clientName, clientEmail, phone, service, date, time, notes }),
      });
      console.log(`[send-booking-emails] admin notification sent → ${ADMIN_EMAIL}`);
    } catch (err) {
      // Non-critical: log but don't fail the response
      console.error("[send-booking-emails] admin notification failed (non-fatal):", err.message);
    }
  }

  return res.status(200).json({ ok: true });
}
