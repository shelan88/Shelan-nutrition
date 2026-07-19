/**
 * PdfDebugModal — on-screen forensic report for PDF export failures.
 *
 * Shows every detail the developer needs when testing on a device with no
 * DevTools: last OK step, failed step, file, function, line, exception
 * message, stack trace, fetch URL, and HTTP status.
 *
 * Stays visible until the user taps "Close".
 */

import type { DebugInfo } from "@/admin/hooks/useClientReport";

interface Props {
  info: DebugInfo;
  onClose: () => void;
}

export default function PdfDebugModal({ info, onClose }: Props) {
  return (
    /* Full-screen dark overlay — fixed so it floats above the drawer */
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/80 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8"
        style={{ background: "#0f0f0f", border: "1px solid #333", color: "#e5e5e5" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "#1a0000", borderBottom: "1px solid #4b0000" }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>🔴</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "#ff6b6b" }}>
              PDF Export — Debug Report
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#333", border: "none", borderRadius: 6,
              color: "#ccc", padding: "4px 12px", cursor: "pointer",
              fontFamily: "monospace", fontSize: 13,
            }}
          >
            ✕ Close
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4" style={{ fontFamily: "monospace", fontSize: 13 }}>

          {/* ── Step summary ──────────────────────────────────────────────── */}
          <Section title="STEP TRACE">
            <Row label="Last OK step" value={info.lastOkStep > 0 ? `STEP ${info.lastOkStep}` : "None — failed before STEP 1"} ok />
            <Row label="Failed step"  value={`STEP ${info.failedStep}`} bad />
          </Section>

          {/* ── Location ──────────────────────────────────────────────────── */}
          <Section title="LOCATION">
            <Row label="File"     value={info.file} />
            <Row label="Function" value={info.fn + "()"} />
            <Row label="Line"     value={String(info.line)} />
          </Section>

          {/* ── Exception ─────────────────────────────────────────────────── */}
          <Section title="EXCEPTION">
            <Row label="Message" value={info.message} bad />
          </Section>

          {/* ── Fetch details (Step 8 logo probe, etc.) ───────────────────── */}
          {(info.fetchUrl || info.httpStatus !== undefined) && (
            <Section title="NETWORK">
              {info.fetchUrl   && <Row label="URL"    value={info.fetchUrl} />}
              {info.httpStatus !== undefined && (
                <Row
                  label="HTTP status"
                  value={String(info.httpStatus)}
                  bad={info.httpStatus >= 400 || info.httpStatus === 0}
                />
              )}
            </Section>
          )}

          {/* ── Step log ──────────────────────────────────────────────────── */}
          <Section title="STEP LOG">
            <div
              className="rounded-lg px-3 py-2 overflow-y-auto"
              style={{ background: "#1a1a1a", maxHeight: 180, border: "1px solid #333" }}
            >
              {info.log.length === 0
                ? <span style={{ color: "#666" }}>No steps logged.</span>
                : info.log.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: line.includes("OK") ? "#4ade80"
                             : line.includes("FAIL") ? "#f87171"
                             : "#a0a0a0",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {line}
                    </div>
                  ))
              }
            </div>
          </Section>

          {/* ── Stack trace ───────────────────────────────────────────────── */}
          <Section title="STACK TRACE">
            <div
              className="rounded-lg px-3 py-2 overflow-y-auto"
              style={{ background: "#1a1a1a", maxHeight: 240, border: "1px solid #333" }}
            >
              <pre
                style={{
                  margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                  color: "#f87171", fontSize: 11, lineHeight: 1.55,
                }}
              >
                {info.stack || "(no stack available)"}
              </pre>
            </div>
          </Section>

          {/* ── Close button ──────────────────────────────────────────────── */}
          <button
            onClick={onClose}
            style={{
              marginTop: 4, padding: "10px 0", borderRadius: 8, cursor: "pointer",
              background: "#1e293b", border: "1px solid #334155",
              color: "#94a3b8", fontFamily: "monospace", fontSize: 13,
              fontWeight: 600, width: "100%",
            }}
          >
            Close Debug Modal
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small primitives ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: "#888", fontSize: 10, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
        {title}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Row({ label, value, ok, bad }: { label: string; value: string; ok?: boolean; bad?: boolean }) {
  return (
    <div className="flex gap-2" style={{ lineHeight: 1.5, flexWrap: "wrap" }}>
      <span style={{ color: "#666", minWidth: 110, flexShrink: 0 }}>{label}:</span>
      <span
        style={{
          color: ok ? "#4ade80" : bad ? "#f87171" : "#e5e5e5",
          wordBreak: "break-all",
          flex: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
