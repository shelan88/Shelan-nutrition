/**
 * traceStore.ts — Execution trace state for Trace Mode.
 *
 * When Trace Mode is active, clicking any UI element starts a fresh trace.
 * Repository and Supabase proxy calls add steps via addTraceStep(), building
 * the chain: Click → Component → Function → Repository → Supabase.
 */

export interface TraceStep {
  label:       string;   // "Click" | "Component" | "Function" | "Repository" | "Supabase"
  detail:      string;
  durationMs?: number;
}

export interface Trace {
  id:        number;
  trigger:   string;
  steps:     TraceStep[];
  completed: boolean;
}

let _on   = false;
let _seq  = 0;
let _cur: Trace | null  = null;
let _last: Trace | null = null;
const _subs = new Set<() => void>();

export const isTraceModeActive = (): boolean      => _on;
export const getCurrentTrace   = (): Trace | null => _cur;
export const getLastTrace      = (): Trace | null => _last;

export function setTraceModeActive(on: boolean): void {
  _on = on;
  if (!on) { _cur = null; _notify(); }
}

export function startTrace(trigger: string): void {
  if (!_on) return;
  _cur = { id: ++_seq, trigger, steps: [{ label: "Click", detail: trigger }], completed: false };
  _notify();
}

export function addTraceStep(step: TraceStep): void {
  if (!_cur) return;
  _cur.steps.push(step);
  _notify();
}

export function completeTrace(): void {
  if (!_cur) return;
  _cur.completed = true;
  _last = _cur;
  _cur  = null;
  _notify();
}

export function subscribeTrace(fn: () => void): () => void {
  _subs.add(fn);
  return () => _subs.delete(fn);
}

function _notify(): void { _subs.forEach((fn) => fn()); }
