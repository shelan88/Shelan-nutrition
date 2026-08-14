/**
 * api/get-assessment-pdf.js
 *
 * Vercel Serverless Function  →  GET /api/get-assessment-pdf
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Returns a print-optimised HTML report of a submitted assessment questionnaire.
 * The admin clicks this link from the "Assessment Submitted" notification email.
 *
 * Security model:
 *   The URL carries an HMAC-SHA256 signature derived from SESSION_SECRET and
 *   the appointmentId.  This ties the link to exactly one appointment and makes
 *   it impossible to guess or reuse for another customer's data.
 *
 *   All data is fetched server-side using the service-role adminClient
 *   (bypasses RLS).  Nothing from the query string is trusted for data access
 *   beyond the appointmentId — which is then used only after the signature
 *   passes.
 *
 * Required env vars:
 *   SESSION_SECRET          — shared secret for HMAC signature
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon key
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (admin access)
 */

import { adminClient }                      from "./_lib/clients.js";
import { computePdfSig, safeCompareSigs }  from "./_lib/assessment-pdf.js";

// ── Display helpers ───────────────────────────────────────────────────────────

function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateLong(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTimeUTC(isoStr) {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString("en-US", {
      dateStyle: "long", timeStyle: "short", timeZone: "UTC",
    }) + " (UTC)";
  } catch {
    return isoStr;
  }
}

/** Resolve a human-readable answer string for a single question row. */
function resolveAnswer(answer, question, allOptions) {
  if (!answer) return "Not answered";

  const qOpts = allOptions.filter((o) => o.question_id === question.id);

  if (question.type === "yes_no") {
    const v = (answer.answer_text ?? "").toLowerCase();
    if (v === "true" || v === "yes") return "Yes / نعم";
    if (v === "false" || v === "no") return "No / لا";
    return answer.answer_text || "—";
  }

  if (question.type === "single_choice" || question.type === "dropdown") {
    if (!answer.answer_text) return "—";
    const opt = qOpts.find((o) => o.value === answer.answer_text);
    return opt ? (opt.label_en || opt.value) : answer.answer_text;
  }

  if (question.type === "multiple_choice") {
    const vals = Array.isArray(answer.answer_json)
      ? answer.answer_json
      : (answer.answer_text ? answer.answer_text.split(", ") : []);
    if (!vals.length) return "—";
    return vals
      .map((v) => {
        const opt = qOpts.find((o) => o.value === v);
        return opt ? (opt.label_en || v) : v;
      })
      .join(" · ");
  }

  if (question.type === "file_upload" || question.type === "image_upload") {
    return "[File attached]";
  }

  return answer.answer_text || "—";
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildReportHtml({ appt, template, response, questions, answers, allOptions }) {
  const clientName   = escHtml(appt.client_name ?? "Client");
  const clientEmail  = escHtml(appt.client_email ?? "—");
  const service      = escHtml(appt.type ?? "—");
  const dateStr      = escHtml(formatDateLong(appt.date));
  const timeStr      = escHtml(appt.time ?? "—");
  const submittedAt  = escHtml(formatDateTimeUTC(response.submitted_at));
  const templateName = escHtml(template?.name_en ?? "Questionnaire");

  const qaRows = questions
    .map((q, idx) => {
      const answer       = answers.find((a) => a.question_id === q.id);
      const displayAns   = resolveAnswer(answer, q, allOptions);
      const labelEn      = escHtml(q.label_en || `Question ${idx + 1}`);
      const labelAr      = q.label_ar ? escHtml(q.label_ar) : null;
      const isUnanswered = !answer;

      return `
        <div class="qa-row">
          <div class="q-label">
            <span class="q-num">${idx + 1}</span>
            <div class="q-texts">
              <span class="q-en">${labelEn}</span>
              ${labelAr ? `<span class="q-ar">${labelAr}</span>` : ""}
            </div>
          </div>
          <div class="a-text${isUnanswered ? " unanswered" : ""}">${escHtml(displayAns)}</div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Assessment Report — ${clientName}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;}
    body{
      margin:0;padding:20px;
      font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;
      font-size:14px;color:#1c1033;background:#f5f0ff;
    }
    .wrap{
      max-width:820px;margin:0 auto;background:#fff;
      border-radius:16px;overflow:hidden;
      box-shadow:0 4px 24px rgba(106,53,181,.12);
    }
    /* Header */
    .hdr{
      background:linear-gradient(135deg,#6a35b5 0%,#f35e98 100%);
      padding:32px 40px 28px;text-align:center;color:#fff;
    }
    .hdr-brand{font-size:11px;letter-spacing:2px;text-transform:uppercase;
               color:rgba(255,255,255,.72);margin:0 0 8px;}
    .hdr-title{font-size:22px;font-weight:700;margin:0 0 4px;}
    .hdr-sub{font-size:13px;color:rgba(255,255,255,.8);margin:0;}
    /* Print bar */
    .print-bar{
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      background:#f9f5ff;border-bottom:1px solid #e8d5f5;padding:14px 40px;
    }
    .print-bar p{margin:0;font-size:13px;color:#7b6997;}
    .print-btn{
      display:inline-flex;align-items:center;gap:8px;
      padding:10px 22px;background:#6a35b5;color:#fff;border:none;
      border-radius:50px;font-family:inherit;font-size:13px;font-weight:700;
      cursor:pointer;text-decoration:none;
    }
    .print-btn:hover{background:#5a28a0;}
    /* Body */
    .body{padding:36px 40px;}
    .sec-lbl{
      font-size:10px;font-weight:700;color:#9b87b8;
      text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;
    }
    /* Info card */
    .info-card{
      border:1px solid #e8d5f5;border-radius:12px;overflow:hidden;
      margin-bottom:28px;
    }
    .info-row{
      display:flex;gap:16px;padding:13px 20px;
      border-bottom:1px solid #e8d5f5;
    }
    .info-row:last-child{border-bottom:none;}
    .info-row:nth-child(odd){background:#f9f5ff;}
    .info-row:nth-child(even){background:#fff;}
    .i-lbl{
      font-size:10px;font-weight:700;color:#9b87b8;
      text-transform:uppercase;letter-spacing:1px;
      min-width:130px;padding-top:3px;flex-shrink:0;
    }
    .i-val{font-size:14px;font-weight:600;color:#1c1033;flex:1;word-break:break-word;}
    /* Q&A section */
    .tmpl-name{
      background:#6a35b5;color:#fff;padding:13px 20px;
      border-radius:12px 12px 0 0;font-size:14px;font-weight:700;
    }
    .qa-list{
      border:1px solid #e8d5f5;border-top:none;
      border-radius:0 0 12px 12px;overflow:hidden;margin-bottom:32px;
    }
    .qa-row{
      padding:15px 20px;border-bottom:1px solid #e8d5f5;
    }
    .qa-row:last-child{border-bottom:none;}
    .qa-row:nth-child(odd){background:#fafafa;}
    .qa-row:nth-child(even){background:#fff;}
    .q-label{display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;}
    .q-num{
      min-width:24px;height:24px;border-radius:50%;
      background:#f35e98;color:#fff;font-size:11px;font-weight:700;
      display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .q-texts{display:flex;flex-direction:column;gap:2px;}
    .q-en{font-size:13px;font-weight:600;color:#1c1033;line-height:1.4;}
    .q-ar{font-size:12px;color:#7b6997;direction:rtl;line-height:1.4;}
    .a-text{
      font-size:14px;color:#1c1033;line-height:1.7;
      padding:10px 14px;margin-left:36px;
      background:#fff;border:1px solid #e8d5f5;border-radius:8px;
      border-left:3px solid #6a35b5;word-break:break-word;
    }
    .a-text.unanswered{color:#b3a6c9;font-style:italic;}
    /* Footer */
    .ftr{
      background:#f9f5ff;border-top:1px solid #e8d5f5;
      padding:20px 40px;text-align:center;
    }
    .ftr p{margin:0 0 3px;font-size:11px;color:#b3a6c9;}
    .ftr strong{color:#6a35b5;font-size:13px;}
    /* Print overrides */
    @media print{
      body{background:#fff;padding:0;}
      .wrap{box-shadow:none;border-radius:0;}
      .print-bar{display:none!important;}
      .hdr,.tmpl-name,.qa-row:nth-child(odd),.info-row:nth-child(odd){
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
      }
      .qa-row{page-break-inside:avoid;}
    }
  </style>
</head>
<body>
<div class="wrap">

  <div class="hdr">
    <p class="hdr-brand">SHELAN Nutrition &mdash; Admin Report</p>
    <h1 class="hdr-title">&#128203; Assessment Report</h1>
    <p class="hdr-sub">${clientName}</p>
  </div>

  <div class="print-bar">
    <p>Open in browser, then click the button to save as PDF.</p>
    <button class="print-btn" onclick="window.print()">&#128424; Print / Save as PDF</button>
  </div>

  <div class="body">

    <p class="sec-lbl">Client Details</p>
    <div class="info-card">
      <div class="info-row"><span class="i-lbl">Name</span><span class="i-val">${clientName}</span></div>
      <div class="info-row"><span class="i-lbl">Email</span><span class="i-val">${clientEmail}</span></div>
    </div>

    <p class="sec-lbl">Booking Details</p>
    <div class="info-card">
      <div class="info-row"><span class="i-lbl">Service</span><span class="i-val">${service}</span></div>
      <div class="info-row"><span class="i-lbl">Date</span><span class="i-val">${dateStr}</span></div>
      <div class="info-row"><span class="i-lbl">Time</span><span class="i-val">${timeStr}</span></div>
      <div class="info-row"><span class="i-lbl">Assessment Submitted</span><span class="i-val">${submittedAt}</span></div>
    </div>

    <p class="sec-lbl">Questionnaire &mdash; ${templateName}</p>
    <div class="tmpl-name">&#128221; ${templateName}</div>
    <div class="qa-list">
      ${qaRows || '<div class="qa-row"><div class="a-text unanswered">No answers recorded.</div></div>'}
    </div>

  </div>

  <div class="ftr">
    <p><strong>SHELAN Nutrition</strong></p>
    <p>Admin Assessment Report &mdash; Generated automatically</p>
    <p>Do not share this link publicly.</p>
  </div>

</div>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { appointmentId, sig } = req.query ?? {};

  if (!appointmentId || !sig) {
    return res.status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>Missing required parameters.</p>");
  }

  // ── Verify HMAC signature ───────────────────────────────────────────────────
  let expectedSig;
  try {
    expectedSig = computePdfSig(appointmentId);
  } catch (e) {
    console.error("[get-assessment-pdf] computeSig error:", e.message);
    return res.status(500)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>Server configuration error. SESSION_SECRET may be missing.</p>");
  }

  if (!safeCompareSigs(sig, expectedSig)) {
    return res.status(403)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>This link is invalid or has expired. Please contact your administrator.</p>");
  }

  // ── Fetch appointment (server-side — never trust query params for data) ─────
  const { data: appt, error: apptErr } = await adminClient
    .from("appointments")
    .select("id, client_name, client_email, type, date, time, assessment_response_id, assessment_status")
    .eq("id", appointmentId)
    .single();

  if (apptErr || !appt) {
    console.error("[get-assessment-pdf] appointment not found:", apptErr?.message);
    return res.status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>Appointment not found.</p>");
  }

  if (!appt.assessment_response_id) {
    return res.status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>No assessment has been submitted for this appointment yet.</p>");
  }

  // ── Fetch response (must be submitted) ──────────────────────────────────────
  const { data: response, error: respErr } = await adminClient
    .from("assessment_responses")
    .select("id, template_id, status, submitted_at")
    .eq("id", appt.assessment_response_id)
    .eq("status", "submitted")
    .single();

  if (respErr || !response) {
    return res.status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("<p style='font-family:sans-serif;padding:2rem;'>The assessment for this appointment has not been completed yet.</p>");
  }

  // ── Fetch questions, options, answers (parallel) ────────────────────────────
  const { data: questions } = await adminClient
    .from("template_questions")
    .select("id, label_en, label_ar, type, sort_order")
    .eq("template_id", response.template_id)
    .order("sort_order", { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);

  const [{ data: allOptions }, { data: answers }, { data: template }] = await Promise.all([
    questionIds.length
      ? adminClient.from("question_options").select("*").in("question_id", questionIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
    adminClient.from("response_answers").select("*").eq("response_id", response.id),
    adminClient.from("assessment_templates").select("name_en, name_ar").eq("id", response.template_id).single(),
  ]);

  const html = buildReportHtml({
    appt,
    template: template ?? null,
    response,
    questions:  questions  ?? [],
    answers:    answers    ?? [],
    allOptions: allOptions ?? [],
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(html);
}
