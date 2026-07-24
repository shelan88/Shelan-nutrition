/**
 * InspectOverlay — component inspector mode.
 *
 * When active: follows the mouse cursor, highlights the hovered element with
 * a teal border, and on click fires onInspect() with component/DOM metadata.
 * The debug panel itself is always excluded from inspection.
 */

import { useEffect, useState, useCallback } from "react";

export interface InspectedInfo {
  componentName: string;
  sourceFile:    string;
  sectionId:     string | null;
  dbTable:       string | null;
  dbRecordId:    string | null;
  visible:       string | null;
  hiddenReason:  string | null;
  tagName:       string;
  elementId:     string | null;
}

interface Props {
  active:    boolean;
  onInspect: (info: InspectedInfo, rect: DOMRect) => void;
}

// ── React fiber helpers (dev mode only) ───────────────────────────────────────

function getFiber(el: Element): Record<string, unknown> | null {
  const key = Object.keys(el).find(
    (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"),
  );
  if (!key) return null;
  const elAsMap = el as unknown as Record<string, unknown>;
  const fiber   = elAsMap[key];
  return fiber != null && typeof fiber === "object"
    ? (fiber as Record<string, unknown>)
    : null;
}

function walkFiber<T>(
  fiber: Record<string, unknown> | null,
  pick: (f: Record<string, unknown>) => T | null,
): T | null {
  let f = fiber;
  while (f) {
    const result = pick(f);
    if (result !== null) return result;
    f = (f.return as Record<string, unknown>) ?? null;
  }
  return null;
}

function getComponentName(fiber: Record<string, unknown> | null): string {
  return walkFiber(fiber, (f) => {
    if (typeof f.type === "function") {
      const fn = f.type as { displayName?: string; name?: string };
      return fn.displayName || fn.name || "Anonymous";
    }
    return null;
  }) ?? "Unknown";
}

function getSourceFile(fiber: Record<string, unknown> | null): string {
  return walkFiber(fiber, (f) => {
    const src = f._debugSource as { fileName?: string; lineNumber?: number } | undefined;
    if (src?.fileName) {
      const short = src.fileName.split("/src/").pop() ?? src.fileName;
      return `src/${short}:${src.lineNumber ?? "?"}`;
    }
    return null;
  }) ?? "";
}

function extractInfo(el: Element): InspectedInfo {
  const fiber = getFiber(el);
  const nearest = (attr: string) =>
    el.closest(`[${attr}]`)?.getAttribute(attr) ?? null;

  return {
    componentName: getComponentName(fiber),
    sourceFile:    getSourceFile(fiber),
    sectionId:     nearest("data-section-id"),
    dbTable:       nearest("data-db-table"),
    dbRecordId:    nearest("data-db-record"),
    visible:       nearest("data-visible"),
    hiddenReason:  nearest("data-hidden-reason"),
    tagName:       el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ""),
    elementId:     el.id || null,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InspectOverlay({ active, onInspect }: Props) {
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const handleInspect = useCallback(onInspect, [onInspect]);

  useEffect(() => {
    if (!active) { setHoverRect(null); return; }

    function onMove(e: MouseEvent) {
      const el = e.target as Element;
      if (el.closest("[data-debug-panel]")) { setHoverRect(null); return; }
      setHoverRect(el.getBoundingClientRect());
    }

    function onClick(e: MouseEvent) {
      const el = e.target as Element;
      if (el.closest("[data-debug-panel]")) return;
      e.preventDefault();
      e.stopPropagation();
      handleInspect(extractInfo(el), el.getBoundingClientRect());
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("click",     onClick, { capture: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click",     onClick, true);
    };
  }, [active, handleInspect]);

  if (!active || !hoverRect) return null;

  return (
    <div
      style={{
        position: "fixed",
        top:      hoverRect.top    - 2,
        left:     hoverRect.left   - 2,
        width:    hoverRect.width  + 4,
        height:   hoverRect.height + 4,
        border:   "2px solid #2dd4bf",
        background: "rgba(45,212,191,0.06)",
        pointerEvents: "none",
        zIndex:   999990,
        borderRadius: 4,
        boxShadow: "0 0 0 1px rgba(45,212,191,0.3), inset 0 0 0 1px rgba(45,212,191,0.1)",
      }}
    />
  );
}
