/**
 * useClientReport — data assembly + PDF generation hook.
 *
 * Forensic build: every async step is numbered STEP 1–11 with its own
 * try/catch.  console.log("STEP X OK") fires after each success.
 * console.error({step,file,function,line,error,stack}) fires on failure,
 * then execution stops immediately (throw).
 *
 * The UI toast shows "STEP FAILED: X" so the exact break-point is visible
 * without opening DevTools.
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

const FILE = "src/admin/hooks/useClientReport.tsx";

/** Log a failed step with full forensic detail and re-throw. */
function failStep(step: number, fn: string, line: number, err: unknown): never {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error("══════════════════════════════════════════════");
  console.error(`STEP ${step} FAILED`);
  console.error("══════════════════════════════════════════════");
  console.error({
    step,
    file:     FILE,
    function: fn,
    line,
    error:    e.message,
    stack:    e.stack,
  });
  console.error("full error object:", err);
  console.error("══════════════════════════════════════════════");
  throw err;
}

export function useClientReport(client: Client | null, isAr: boolean) {
  const [generating,    setGenerating]    = useState(false);
  const [pdfToast,      setPdfToast]      = useState<PdfToastState>("idle");
  const [failedStep,    setFailedStep]    = useState<number>(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const lastSectionsRef  = useRef<ReportSections>({ ...ALL_SECTIONS_ON });
  const retryActionRef   = useRef<PendingAction>(null);
  const retrySectionsRef = useRef<ReportSections>({ ...ALL_SECTIONS_ON });

  // ── Core pipeline ────────────────────────────────────────────────────────

  async function buildBlob(
    sections: ReportSections,
    onStepFail: (step: number) => void,
  ): Promise<Blob | null> {

    // ── STEP 3: Fetching client ─────────────────────────────────────────────
    try {
      console.log("STEP 3 — Fetching client");
      if (!client) throw new Error("client prop is null — drawer opened without a client");
      console.log("STEP 3 OK", { clientId: client.id, email: client.email });
    } catch (err) {
      onStepFail(3);
      failStep(3, "buildBlob", 73, err);
    }
    if (!client) return null; // unreachable, satisfies TS

    // ── STEP 4: Fetching assessment ─────────────────────────────────────────
    let responses;
    try {
      console.log("STEP 4 — Fetching assessment responses for", client.email);
      responses = await getSubmittedResponsesWithTemplateNames(client.email);
      console.log("STEP 4 OK", { count: responses.length, latest: responses[0]?.id ?? "none" });
    } catch (err) {
      onStepFail(4);
      failStep(4, "buildBlob", 84, err);
    }

    const latest = responses![0] ?? null;

    const needsResponse = sections.assessmentSummary || sections.qa;
    let response = null;
    if (latest && needsResponse) {
      try {
        console.log("STEP 4b — Fetching full response detail for id:", latest.id);
        response = await getResponse(latest.id);
        console.log("STEP 4b OK", { responseId: response?.id ?? "null", answerCount: response?.answers?.length ?? 0 });
      } catch (err) {
        onStepFail(4);
        failStep(4, "buildBlob", 97, err);
      }
    }

    // ── STEP 5: Building report model ──────────────────────────────────────
    let templateName: string;
    let logoUrl: string;
    let generatedAt: string;
    try {
      console.log("STEP 5 — Building report model");
      templateName = latest
        ? ((isAr && latest.template_name_ar) ? latest.template_name_ar : latest.template_name_en)
        : "";
      logoUrl      = `${window.location.origin}/logo.png`;
      generatedAt  = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      console.log("STEP 5 OK", { templateName, logoUrl, generatedAt });
    } catch (err) {
      onStepFail(5);
      failStep(5, "buildBlob", 113, err);
    }

    // ── STEP 6: Creating PDF instance (synchronous JSX render) ────────────
    let instance: ReturnType<typeof pdf>;
    try {
      console.log("STEP 6 — Creating PDF instance (pdf(<ClinicReportDocument .../>))");
      instance = pdf(
        <ClinicReportDocument
          client={client}
          isAr={isAr}
          response={response}
          templateName={templateName!}
          logoUrl={logoUrl!}
          generatedAt={generatedAt!}
          sections={sections}
        />
      );
      console.log("STEP 6 OK — pdf() instance created");
    } catch (err) {
      onStepFail(6);
      failStep(6, "buildBlob", 127, err);
    }

    // ── STEP 7: Loading fonts ──────────────────────────────────────────────
    // Fonts are loaded lazily inside toBlob(); we cannot intercept them
    // directly, but a font-load failure will surface as a toBlob() rejection.
    // Log the registered sources so the console shows what react-pdf will fetch.
    try {
      console.log("STEP 7 — Font sources about to be fetched by react-pdf:");
      console.log("  Cairo-Regular:", `${window.location.origin}/fonts/Cairo-Regular.ttf`);
      console.log("  Cairo-Bold:   ", `${window.location.origin}/fonts/Cairo-Bold.ttf`);
      console.log("STEP 7 OK — font paths logged (actual fetch happens inside toBlob)");
    } catch (err) {
      onStepFail(7);
      failStep(7, "buildBlob", 141, err);
    }

    // ── STEP 8: Loading logo ───────────────────────────────────────────────
    try {
      console.log("STEP 8 — Logo URL that react-pdf will fetch:", logoUrl!);
      const probe = await fetch(logoUrl!, { method: "HEAD" });
      console.log("STEP 8 OK — logo HEAD probe:", probe.status, probe.ok ? "reachable" : "NOT REACHABLE");
      if (!probe.ok) {
        throw new Error(`Logo fetch returned HTTP ${probe.status} for ${logoUrl}`);
      }
    } catch (err) {
      onStepFail(8);
      failStep(8, "buildBlob", 153, err);
    }

    // ── STEP 9: Rendering pages (toBlob entry) ────────────────────────────
    console.log("STEP 9 — Entering toBlob() — react-pdf will now render all pages");

    // ── STEP 10: Generating Blob ──────────────────────────────────────────
    let blob: Blob;
    try {
      console.log("STEP 10 — Awaiting toBlob()");
      blob = await instance!.toBlob();
      console.log("STEP 10 OK — blob size:", blob.size, "bytes, type:", blob.type);
    } catch (err) {
      onStepFail(10);
      failStep(10, "buildBlob", 167, err);
    }

    return blob!;
  }

  // ── Export runner ────────────────────────────────────────────────────────

  async function runExport(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setFailedStep(0);
    setPdfToast("generating");

    const onStepFail = (step: number) => setFailedStep(step);

    try {
      const blob = await buildBlob(sections, onStepFail);
      if (!blob) { setPdfToast("idle"); return; }

      // ── STEP 11: Downloading file ────────────────────────────────────────
      try {
        console.log("STEP 11 — Downloading file");
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        a.href     = url;
        a.download = `${client.fullName.replace(/\s+/g, "_")}_Report_${date}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        console.log("STEP 11 OK — download triggered:", a.download);
        setPdfToast("idle");
      } catch (err) {
        onStepFail(11);
        failStep(11, "runExport", 201, err);
      }
    } catch (err) {
      console.error("[useClientReport] runExport caught top-level error:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  async function runPrint(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setFailedStep(0);
    setPdfToast("generating");

    const onStepFail = (step: number) => setFailedStep(step);

    try {
      const blob = await buildBlob(sections, onStepFail);
      if (!blob) { setPdfToast("idle"); return; }

      try {
        console.log("STEP 11 — Opening PDF in new tab");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        console.log("STEP 11 OK — new tab opened");
        setPdfToast("idle");
      } catch (err) {
        onStepFail(11);
        failStep(11, "runPrint", 229, err);
      }
    } catch (err) {
      console.error("[useClientReport] runPrint caught top-level error:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  // ── STEP 1 + 2 live here ─────────────────────────────────────────────────

  function handleExport(): void {
    console.log("STEP 1 — Export button clicked");
    console.log("STEP 1 OK", { clientId: client?.id });
    if (!client || generating) return;
    setPendingAction("export");
  }

  function handlePrint(): void {
    console.log("STEP 1 — Print button clicked");
    console.log("STEP 1 OK", { clientId: client?.id });
    if (!client || generating) return;
    setPendingAction("print");
  }

  async function confirmGenerate(sections: ReportSections): Promise<void> {
    console.log("STEP 2 — Selected sections collected");
    console.log("STEP 2 OK", sections);
    const action = pendingAction;
    lastSectionsRef.current  = { ...sections };
    retryActionRef.current   = action;
    retrySectionsRef.current = { ...sections };
    setPendingAction(null);
    if (action === "export") await runExport(sections);
    else if (action === "print") await runPrint(sections);
  }

  function cancelModal(): void { setPendingAction(null); }

  function retryLast(): void {
    const action   = retryActionRef.current;
    const sections = retrySectionsRef.current;
    if (action === "export") runExport(sections);
    else if (action === "print") runPrint(sections);
  }

  function dismissToast(): void {
    setPdfToast("idle");
    setFailedStep(0);
  }

  return {
    generating,
    handleExport,
    handlePrint,
    pdfToast,
    failedStep,
    retryLast,
    dismissToast,
    pendingAction,
    lastSections: lastSectionsRef,
    confirmGenerate,
    cancelModal,
  };
}
