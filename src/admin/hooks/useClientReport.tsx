/**
 * useClientReport — data assembly + PDF generation hook.
 *
 * Forensic build: every async step (1–11) is wrapped in its own try/catch.
 * On success: appends "STEP X OK ..." to a running log array.
 * On failure: populates a DebugInfo object (shown in PdfDebugModal on screen)
 *             AND still calls console.error so DevTools also captures it.
 * Execution stops immediately after the first failure (throw).
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

// ── Public debug shape ────────────────────────────────────────────────────────

export interface DebugInfo {
  lastOkStep: number;
  failedStep: number;
  file:       string;
  fn:         string;
  line:       number;
  message:    string;
  stack:      string;
  fetchUrl?:  string;
  httpStatus?: number;
  log:        string[];   // chronological step log for the modal
}

export type PdfToastState = "idle" | "generating" | "error";
export type PendingAction  = "export" | "print" | null;

const FILE = "src/admin/hooks/useClientReport.tsx";

// ── Step-logging helpers ──────────────────────────────────────────────────────

function stepOk(log: string[], step: number | string, detail = ""): void {
  const entry = `STEP ${step} OK${detail ? " — " + detail : ""}`;
  log.push(entry);
  console.log(entry);
}

function stepFail(
  log: string[],
  step: number,
  fn: string,
  line: number,
  err: unknown,
  extra?: { fetchUrl?: string; httpStatus?: number },
): DebugInfo {
  const e = err instanceof Error ? err : new Error(String(err));
  const last = log.length > 0 ? log[log.length - 1] : "";
  // Parse lastOkStep from the last "STEP X OK" entry
  const match = last.match(/^STEP (\d+)/);
  const lastOkStep = match ? parseInt(match[1], 10) : 0;

  const entry = `STEP ${step} FAILED — ${e.message}`;
  log.push(entry);

  const info: DebugInfo = {
    lastOkStep,
    failedStep: step,
    file:       FILE,
    fn,
    line,
    message:    e.message,
    stack:      e.stack ?? "(no stack)",
    fetchUrl:   extra?.fetchUrl,
    httpStatus: extra?.httpStatus,
    log:        [...log],
  };

  // Also write to console so DevTools captures it on desktop
  console.error("══════ PDF EXPORT FAILURE ══════");
  console.error(`STEP ${step} FAILED`, info);
  console.error("full error:", err);
  console.error("════════════════════════════════");

  return info;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useClientReport(client: Client | null, isAr: boolean) {
  const [generating,    setGenerating]    = useState(false);
  const [pdfToast,      setPdfToast]      = useState<PdfToastState>("idle");
  const [debugInfo,     setDebugInfo]     = useState<DebugInfo | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const lastSectionsRef  = useRef<ReportSections>({ ...ALL_SECTIONS_ON });
  const retryActionRef   = useRef<PendingAction>(null);
  const retrySectionsRef = useRef<ReportSections>({ ...ALL_SECTIONS_ON });

  // ── Core pipeline ──────────────────────────────────────────────────────────

  async function buildBlob(sections: ReportSections): Promise<Blob | null> {
    const log: string[] = [];

    // ── STEP 3: Fetching client ───────────────────────────────────────────
    log.push("STEP 3 — Fetching client");
    try {
      if (!client) throw new Error("client prop is null — drawer opened without a client");
      stepOk(log, 3, `id=${client.id} email=${client.email}`);
    } catch (err) {
      setDebugInfo(stepFail(log, 3, "buildBlob", 111, err));
      throw err;
    }
    if (!client) return null;

    // ── STEP 4: Fetching assessment ───────────────────────────────────────
    log.push(`STEP 4 — Fetching assessment responses for ${client.email}`);
    let responses;
    try {
      responses = await getSubmittedResponsesWithTemplateNames(client.email);
      stepOk(log, 4, `count=${responses.length} latest=${responses[0]?.id ?? "none"}`);
    } catch (err) {
      setDebugInfo(stepFail(log, 4, "buildBlob", 122, err));
      throw err;
    }

    const latest = responses[0] ?? null;
    const needsResponse = sections.assessmentSummary || sections.qa;
    let response = null;

    if (latest && needsResponse) {
      log.push(`STEP 4b — Fetching full response for id=${latest.id}`);
      try {
        response = await getResponse(latest.id);
        stepOk(log, "4b", `responseId=${response?.id ?? "null"} answers=${response?.answers?.length ?? 0}`);
      } catch (err) {
        setDebugInfo(stepFail(log, 4, "buildBlob", 134, err));
        throw err;
      }
    }

    // ── STEP 5: Building report model ─────────────────────────────────────
    log.push("STEP 5 — Building report model");
    let templateName: string;
    let logoUrl: string;
    let generatedAt: string;
    try {
      templateName = latest
        ? ((isAr && latest.template_name_ar) ? latest.template_name_ar : latest.template_name_en)
        : "";
      logoUrl     = `${window.location.origin}/logo.png`;
      generatedAt = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      stepOk(log, 5, `logoUrl=${logoUrl} templateName="${templateName}"`);
    } catch (err) {
      setDebugInfo(stepFail(log, 5, "buildBlob", 152, err));
      throw err;
    }

    // ── STEP 6: Creating PDF instance (synchronous JSX render) ────────────
    log.push("STEP 6 — Creating PDF instance pdf(<ClinicReportDocument/>)");
    let instance: ReturnType<typeof pdf>;
    try {
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
      stepOk(log, 6, "pdf() instance created");
    } catch (err) {
      setDebugInfo(stepFail(log, 6, "buildBlob", 162, err));
      throw err;
    }

    // ── STEP 7: Font paths (fetched internally by toBlob) ─────────────────
    log.push("STEP 7 — Noting font paths react-pdf will fetch");
    try {
      const regularUrl = `${window.location.origin}/fonts/Cairo-Regular.ttf`;
      const boldUrl    = `${window.location.origin}/fonts/Cairo-Bold.ttf`;
      stepOk(log, 7, `Cairo-Regular=${regularUrl} | Cairo-Bold=${boldUrl}`);
    } catch (err) {
      setDebugInfo(stepFail(log, 7, "buildBlob", 178, err));
      throw err;
    }

    // ── STEP 8: Logo reachability probe ───────────────────────────────────
    log.push(`STEP 8 — HEAD probe for logo: ${logoUrl!}`);
    try {
      const probe = await fetch(logoUrl!, { method: "HEAD" });
      if (!probe.ok) {
        throw new Error(`HTTP ${probe.status} — logo not reachable at ${logoUrl}`);
      }
      stepOk(log, 8, `HTTP ${probe.status} — logo reachable`);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      // Parse HTTP status from the error message if present
      const statusMatch = e.message.match(/HTTP (\d+)/);
      const httpStatus  = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
      setDebugInfo(stepFail(log, 8, "buildBlob", 191, err, { fetchUrl: logoUrl!, httpStatus }));
      throw err;
    }

    // ── STEP 9: Entering toBlob (react-pdf renders + loads fonts+images) ──
    log.push("STEP 9 — Entering toBlob() — react-pdf renders pages, loads fonts & images");
    console.log("STEP 9 — entering toBlob()");

    // ── STEP 10: Generating Blob ──────────────────────────────────────────
    log.push("STEP 10 — Awaiting instance.toBlob()");
    let blob: Blob;
    try {
      blob = await instance!.toBlob();
      stepOk(log, 10, `size=${blob.size} bytes type=${blob.type}`);
    } catch (err) {
      setDebugInfo(stepFail(log, 10, "buildBlob", 204, err));
      throw err;
    }

    return blob!;
  }

  // ── Export runner ──────────────────────────────────────────────────────────

  async function runExport(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setDebugInfo(null);
    setPdfToast("generating");

    try {
      const blob = await buildBlob(sections);
      if (!blob) { setPdfToast("idle"); return; }

      // ── STEP 11: Downloading file ──────────────────────────────────────
      const log: string[] = ["STEP 11 — Creating object URL and triggering download"];
      try {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        a.href     = url;
        a.download = `${client.fullName.replace(/\s+/g, "_")}_Report_${date}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        stepOk(log, 11, `file=${a.download}`);
        setPdfToast("idle");
      } catch (err) {
        setDebugInfo(stepFail(log, 11, "runExport", 232, err));
        throw err;
      }
    } catch (err) {
      console.error("[useClientReport] runExport top-level catch:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  async function runPrint(sections: ReportSections): Promise<void> {
    if (!client || generating) return;
    setGenerating(true);
    setDebugInfo(null);
    setPdfToast("generating");

    try {
      const blob = await buildBlob(sections);
      if (!blob) { setPdfToast("idle"); return; }

      const log: string[] = ["STEP 11 — Opening PDF in new tab"];
      try {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        stepOk(log, 11, "new tab opened");
        setPdfToast("idle");
      } catch (err) {
        setDebugInfo(stepFail(log, 11, "runPrint", 260, err));
        throw err;
      }
    } catch (err) {
      console.error("[useClientReport] runPrint top-level catch:", err);
      setPdfToast("error");
    } finally {
      setGenerating(false);
    }
  }

  // ── STEP 1 + 2 ────────────────────────────────────────────────────────────

  function handleExport(): void {
    console.log("STEP 1 OK — Export button clicked", { clientId: client?.id });
    if (!client || generating) return;
    setPendingAction("export");
  }

  function handlePrint(): void {
    console.log("STEP 1 OK — Print button clicked", { clientId: client?.id });
    if (!client || generating) return;
    setPendingAction("print");
  }

  async function confirmGenerate(sections: ReportSections): Promise<void> {
    console.log("STEP 2 OK — Sections confirmed", sections);
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

  function dismissToast(): void  { setPdfToast("idle"); }
  function clearDebug(): void    { setDebugInfo(null); }

  return {
    generating,
    handleExport,
    handlePrint,
    pdfToast,
    debugInfo,
    clearDebug,
    retryLast,
    dismissToast,
    pendingAction,
    lastSections: lastSectionsRef,
    confirmGenerate,
    cancelModal,
  };
}
