/**
 * useClientReport — data assembly + PDF generation hook.
 *
 * Flow:
 *   1. User clicks Print or Export → pendingAction is set ("print" | "export")
 *   2. ClientDrawer renders the ReportSectionsModal
 *   3. User confirms section selection → confirmGenerate(sections) is called
 *   4. PDF is built with only the selected sections and delivered
 *
 * Exposed:
 *   - pendingAction   → "print" | "export" | null  (drives modal visibility)
 *   - cancelModal()   → dismiss modal without generating
 *   - confirmGenerate(sections) → build + deliver PDF
 *   - generating      → boolean spinner state while building
 *   - pdfToast        → "idle" | "generating" | "error"
 *   - retryLast()     → retries last failed action with last sections
 *   - dismissToast()  → clears error toast
 */

import { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import ClinicReportDocument from "@/admin/utils/clinicReport";
import type { ReportSections } from "@/admin/utils/clinicReport";
import { ALL_SECTIONS_ON } from "@/admin/utils/clinicReport";
import type { Client } from "@/admin/data/clients";
import {
  getSubmittedResponsesWithTemplateNames,
  getResponse,
} from "@/admin/repositories/assessment-responses.repository";

export type PdfToastState = "idle" | "generating" | "error";
export type PendingAction  = "export" | "print" | null;

export function useClientReport(client: Client | null, isAr: boolean) {
  const [generating,    setGenerating]    = useState(false);
  const [pdfToast,      setPdfToast]      = useState<PdfToastState>("idle");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Remembers last-used sections so the modal re-opens with the same state.
  const lastSectionsRef  = useRef<ReportSections>({ ...ALL_SECTIONS_ON });
  // Remembers last action + sections so retryLast() works after an error.
  const retryActionRef   = useRef<PendingAction>(null);
  const retrySectionsRef = useRef<ReportSections>({ ...ALL_SECTIONS_ON });

  /** Fetch all data and build the PDF blob with the given section toggles. */
  async function buildBlob(sections: ReportSections): Promise<Blob | null> {
    if (!client) return null;

    // ── Step 1: fetch submitted assessment responses ────────────────────────
    let responses;
    try {
      responses = await getSubmittedResponsesWithTemplateNames(client.email);
      console.log("[buildBlob] step 1 OK — responses:", responses.length);
    } catch (err: unknown) {
      const e = err as Error;
      console.error("[buildBlob] ✖ step 1 FAILED — getSubmittedResponsesWithTemplateNames");
      console.error("[buildBlob]   message:", e?.message);
      console.error("[buildBlob]   stack:  ", e?.stack);
      throw err;
    }

    const latest = responses[0] ?? null;

    // ── Step 2: fetch full response detail (answers + questions) ────────────
    const needsResponse = sections.assessmentSummary || sections.qa;
    let response = null;
    if (latest && needsResponse) {
      try {
        response = await getResponse(latest.id);
        console.log("[buildBlob] step 2 OK — response id:", response?.id ?? "null");
      } catch (err: unknown) {
        const e = err as Error;
        console.error("[buildBlob] ✖ step 2 FAILED — getResponse(", latest.id, ")");
        console.error("[buildBlob]   message:", e?.message);
        console.error("[buildBlob]   stack:  ", e?.stack);
        throw err;
      }
    }

    // Build template name string (language-aware).
    const templateName = latest
      ? ((isAr && latest.template_name_ar) ? latest.template_name_ar : latest.template_name_en)
      : "";

    // Absolute logo URL (react-pdf fetches fonts/images via URL in browser).
    const logoUrl = `${window.location.origin}/logo.png`;

    // Formatted generation timestamp.
    const generatedAt = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      day:    "numeric",
      month:  "long",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });

    // ── Step 3: render react-pdf document → Blob ────────────────────────────
    console.log("[buildBlob] step 3 — calling pdf().toBlob()", {
      clientId:     client.id,
      isAr,
      hasResponse:  !!response,
      hasLogoUrl:   !!logoUrl,
      sections,
    });
    try {
      const blob = await pdf(
        <ClinicReportDocument
          client={client}
          isAr={isAr}
          response={response}
          templateName={templateName}
          logoUrl={logoUrl}
          generatedAt={generatedAt}
          sections={sections}
        />
      ).toBlob();
      console.log("[buildBlob] step 3 OK — blob size:", blob.size, "bytes, type:", blob.type);
      return blob;
    } catch (err: unknown) {
      const e = err as Error;
      console.error("[buildBlob] ✖ step 3 FAILED — pdf().toBlob() threw");
      console.error("[buildBlob]   message:", e?.message);
      console.error("[buildBlob]   stack:  ", e?.stack);
      console.error("[buildBlob]   full error object:", err);
      throw err;
    }
  }

  /** Download the PDF as a file. */
  async function runExport(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setPdfToast("generating");
    try {
      const blob = await buildBlob(sections);
      if (!blob) { setPdfToast("idle"); return; }
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href     = url;
      a.download = `${client.fullName.replace(/\s+/g, "_")}_Report_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setPdfToast("idle");
    } catch (err) {
      console.error("[useClientReport] export failed:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  /** Open the PDF in a new tab so the user can print from the browser. */
  async function runPrint(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setPdfToast("generating");
    try {
      const blob = await buildBlob(sections);
      if (!blob) { setPdfToast("idle"); return; }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Keep the blob alive for 60 s so the new tab can fully load before revoke.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setPdfToast("idle");
    } catch (err) {
      console.error("[useClientReport] print failed:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  /** Open the section-picker modal for export. */
  function handleExport(): void {
    if (!client || generating) return;
    setPendingAction("export");
  }

  /** Open the section-picker modal for print. */
  function handlePrint(): void {
    if (!client || generating) return;
    setPendingAction("print");
  }

  /**
   * Called when the user confirms sections in the modal.
   * Closes the modal and kicks off generation.
   */
  async function confirmGenerate(sections: ReportSections): Promise<void> {
    const action = pendingAction;
    // Save for retry and for next modal open.
    lastSectionsRef.current  = { ...sections };
    retryActionRef.current   = action;
    retrySectionsRef.current = { ...sections };
    // Close modal immediately so the generating overlay takes over.
    setPendingAction(null);
    if (action === "export") await runExport(sections);
    else if (action === "print") await runPrint(sections);
  }

  /** Dismiss the modal without generating. */
  function cancelModal(): void {
    setPendingAction(null);
  }

  /** Retry the last failed action with the same sections. */
  function retryLast(): void {
    const action   = retryActionRef.current;
    const sections = retrySectionsRef.current;
    retryActionRef.current = action; // keep it
    if (action === "export") runExport(sections);
    else if (action === "print") runPrint(sections);
  }

  /** Dismiss an error toast manually. */
  function dismissToast(): void {
    setPdfToast("idle");
  }

  return {
    generating,
    handleExport,
    handlePrint,
    pdfToast,
    retryLast,
    dismissToast,
    // Modal state
    pendingAction,
    lastSections: lastSectionsRef,
    confirmGenerate,
    cancelModal,
  };
}
