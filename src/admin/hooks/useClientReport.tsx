/**
 * useClientReport — data assembly + PDF generation hook.
 *
 * Fetches the most recent submitted assessment response for the client,
 * assembles a ReportData object, and exposes:
 *   - handleExport()  → downloads a PDF file
 *   - handlePrint()   → opens the PDF in a new tab for browser printing
 *   - generating      → boolean spinner state for both buttons
 *   - pdfToast        → toast state: "idle" | "generating" | "error"
 *   - retryLast()     → retries the last failed action
 *
 * Graceful fallback: if no submitted assessment response exists in Supabase,
 * the PDF is generated with client info + health indicators only (no Q&A).
 */

import { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import ClinicReportDocument from "@/admin/utils/clinicReport";
import type { Client } from "@/admin/data/clients";
import {
  getSubmittedResponsesWithTemplateNames,
  getResponse,
} from "@/admin/repositories/assessment-responses.repository";

export type PdfToastState = "idle" | "generating" | "error";

export function useClientReport(client: Client | null, isAr: boolean) {
  const [generating,   setGenerating]   = useState(false);
  const [pdfToast,     setPdfToast]     = useState<PdfToastState>("idle");
  const lastActionRef = useRef<"export" | "print" | null>(null);

  /** Fetch all data and build the PDF blob. */
  async function buildBlob(): Promise<Blob | null> {
    if (!client) return null;

    // Fetch most-recent submitted assessment response (enriched with template name).
    const responses = await getSubmittedResponsesWithTemplateNames(client.email);
    const latest    = responses[0] ?? null;

    // Load full Q&A if a submitted response exists.
    const response = latest ? await getResponse(latest.id) : null;

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

    return pdf(
      <ClinicReportDocument
        client={client}
        isAr={isAr}
        response={response}
        templateName={templateName}
        logoUrl={logoUrl}
        generatedAt={generatedAt}
      />
    ).toBlob();
  }

  /** Download the PDF as a file. */
  async function handleExport(): Promise<void> {
    if (!client || generating) return;
    lastActionRef.current = "export";
    setGenerating(true);
    setPdfToast("generating");
    try {
      const blob = await buildBlob();
      if (!blob) { setPdfToast("idle"); return; }
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
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
  async function handlePrint(): Promise<void> {
    if (!client || generating) return;
    lastActionRef.current = "print";
    setGenerating(true);
    setPdfToast("generating");
    try {
      const blob = await buildBlob();
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

  /** Retry the last failed action. */
  function retryLast(): void {
    if (lastActionRef.current === "export") handleExport();
    else if (lastActionRef.current === "print") handlePrint();
  }

  /** Dismiss an error toast manually. */
  function dismissToast(): void {
    setPdfToast("idle");
  }

  return { generating, handleExport, handlePrint, pdfToast, retryLast, dismissToast };
}
