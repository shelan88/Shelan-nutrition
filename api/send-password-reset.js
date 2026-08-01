/**
 * api/send-password-reset.js
 *
 * Vercel Serverless Function  →  POST /api/send-password-reset
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Generates a Supabase password-recovery link via the admin API and sends
 * a branded, localised email through Resend.  Supports "en" (English) and
 * "ar" (Arabic / RTL).
 *
 * Required env vars:
 *   RESEND_API_KEY   — Resend (resend.com) API key
 *   FROM_EMAIL       — verified sender, e.g. "Shelan Nutrition <noreply@shelancircle.com>"
 *
 * Body (JSON):
 *   email  {string}          — recipient email address
 *   lang   {"en"|"ar"}       — desired language for the email (default "en")
 */

import { adminClient } from "./_lib/clients.js";

const DEFAULT_WEBSITE_URL = "https://shelancircle.com";

function getEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL:     process.env.FROM_EMAIL ?? "Shelan Nutrition <noreply@shelancircle.com>",
  };
}

// ── Resend helper ─────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  const { RESEND_API_KEY, FROM_EMAIL } = getEnv();
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not configured.");
  }
  const payload = { from: FROM_EMAIL, to: [to], subject, html };

  console.log(`[send-password-reset] → to: ${to} | subject: ${subject}`);

  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error(`[send-password-reset] ✗ HTTP ${resp.status} | ${JSON.stringify(body)}`);
    throw new Error(`Resend ${resp.status}: ${body.message ?? JSON.stringify(body)}`);
  }
  console.log(`[send-password-reset] ✓ id: ${body.id ?? "unknown"}`);
  return body;
}

// ── Brand header (shared with booking emails) ─────────────────────────────────

function brandHeader({ isAr }) {
  const websiteUrl = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const logoSrc    = `${websiteUrl}/logo-email.png`;
  const subtitle   = isAr ? "شيلان للتغذية" : "Nutrition &amp; Lipedema Care";
  const eyebrow    = isAr ? "إعادة تعيين كلمة المرور" : "PASSWORD RESET";
  const title      = isAr ? "إعادة تعيين كلمة المرور" : "Reset Your Password";

  return `
    <tr>
      <td align="center" bgcolor="#6a35b5"
          style="background:linear-gradient(135deg,#6a35b5 0%,#f35e98 100%);
                 padding:36px 40px 28px;">

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

        <p style="margin:0 0 16px;font-family:Arial,'Helvetica Neue',sans-serif;
                  font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:2px;
                  text-align:center;text-transform:uppercase;">${subtitle}</p>

        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 auto 16px;">
          <tr>
            <td width="40" height="1" bgcolor="rgba(255,255,255,0.3)"
                style="background-color:rgba(255,255,255,0.3);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>

        <p style="margin:0 0 6px;font-family:Arial,'Helvetica Neue',sans-serif;
                  font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:2px;
                  text-align:center;text-transform:uppercase;">${eyebrow}</p>

        <h1 style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                   font-size:20px;font-weight:700;color:#ffffff;text-align:center;
                   line-height:1.3;">${title}</h1>
      </td>
    </tr>`;
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function resetEmailHtml({ resetLink, lang }) {
  const isAr      = lang === "ar";
  const dir       = isAr ? "rtl" : "ltr";
  const textAlign = isAr ? "right" : "left";

  const pageTitle = isAr
    ? "إعادة تعيين كلمة المرور — شيلان"
    : "Reset Your Password — SHELAN";

  const intro = isAr
    ? "طلبتِ إعادة تعيين كلمة المرور لحسابكِ. انقري على الزر أدناه لإنشاء كلمة مرور جديدة."
    : "You requested a password reset for your account. Click the button below to create a new password.";

  const ctaLabel = isAr ? "إعادة تعيين كلمة المرور" : "Reset Password";

  const expiry = isAr
    ? "هذا الرابط صالح لمدة ساعة واحدة فقط."
    : "This link is valid for one hour.";

  const ignore = isAr
    ? "إذا لم تطلبي إعادة تعيين كلمة المرور، يمكنكِ تجاهل هذا البريد الإلكتروني بأمان — لن يتغير حسابكِ."
    : "If you didn\u2019t request a password reset, you can safely ignore this email \u2014 your account will not be changed.";

  const footerBrand = isAr ? "شيلان للتغذية" : "SHELAN Nutrition";
  const footerSub   = isAr
    ? "استشارات تغذية متخصصة · إدارة الليبيديما"
    : "Personalized Nutrition \xb7 Lipedema Management";
  const footerAuto  = isAr
    ? "هذا البريد أُرسل تلقائياً — يُرجى عدم الرد عليه مباشرة."
    : "This email was sent automatically. Please do not reply directly.";

  const header = brandHeader({ isAr });

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

              <!-- Intro -->
              <p style="margin:0 0 28px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:15px;color:#4a3566;line-height:1.8;">${intro}</p>

              <!-- CTA button -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:28px;">
                <tr>
                  <td bgcolor="#f35e98"
                      style="border-radius:50px;background-color:#f35e98;
                             box-shadow:0 4px 14px rgba(243,94,152,0.35);">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 36px;
                              font-family:Arial,'Helvetica Neue',sans-serif;
                              font-size:15px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:0.3px;"
                       target="_blank">${ctaLabel}</a>
                  </td>
                </tr>
              </table>

              <!-- Expiry note -->
              <p style="margin:0 0 20px;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:13px;color:#9b87b8;line-height:1.6;">${expiry}</p>

              <!-- Divider -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:20px;">
                <tr>
                  <td height="1" bgcolor="#e8d5f5"
                      style="background-color:#e8d5f5;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Ignore note -->
              <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;
                         font-size:12px;color:#b3a6c9;line-height:1.7;">${ignore}</p>

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

  const { email, lang = "en" } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ error: "Missing required field: email." });
  }

  const isAr = lang === "ar";

  // ── Generate the recovery link via Supabase admin API ──────────────────────
  const websiteUrl = process.env.WEBSITE_URL || DEFAULT_WEBSITE_URL;
  const redirectTo = `${websiteUrl}/reset-password`;

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type:    "recovery",
    email:   email.trim(),
    options: { redirectTo },
  });

  if (linkError) {
    // Don't reveal whether the email exists — log internally and return success
    console.error("[send-password-reset] generateLink error:", linkError.message);
    // Return 200 so the UI shows "check your inbox" regardless (prevents email enumeration)
    return res.status(200).json({ ok: true });
  }

  const resetLink = linkData?.properties?.action_link;
  if (!resetLink) {
    console.error("[send-password-reset] No action_link in generateLink response:", JSON.stringify(linkData));
    return res.status(200).json({ ok: true });
  }

  // ── Send the localised email ───────────────────────────────────────────────
  const subject = isAr
    ? "إعادة تعيين كلمة المرور — شيلان"
    : "Reset Your Password — SHELAN";

  try {
    await sendEmail({
      to:      email.trim(),
      subject,
      html:    resetEmailHtml({ resetLink, lang }),
    });
  } catch (err) {
    console.error("[send-password-reset] sendEmail error:", err.message);
    // Still respond 200 to avoid leaking whether an account exists
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
