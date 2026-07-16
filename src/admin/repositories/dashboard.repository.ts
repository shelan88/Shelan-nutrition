/**
 * dashboard.repository.ts — SHELAN Admin Portal
 *
 * In-memory singleton for dashboard stats and the recent-assessment queue.
 * Reactive via useSyncExternalStore — DashboardPage re-renders automatically
 * whenever an assessment submission lands.
 *
 * Supabase migration path:
 *   - Replace each function body with the corresponding Supabase call.
 *   - The hook `useDashboardStore` stays the same — DashboardPage needs no change.
 */

import { useSyncExternalStore } from "react";
import { MOCK_CLIENTS } from "@/admin/data/clients";
import type { RiskLevel } from "@/admin/data/clients";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardAssessmentEntry {
  client: string;
  initials: string;
  date: string;
  risk: RiskLevel;
  status: "Pending" | "Reviewed" | "Flagged";
}

export interface DashboardStats {
  totalClients: number;
  pendingAssessments: number;
  assessmentEntries: DashboardAssessmentEntry[];
  newClientsThisMonth: number;
}

// ─── Initial seed data ─────────────────────────────────────────────────────────

const BASE_PENDING_ASSESSMENTS = 7;

/** Pre-populated assessment queue — mirrors what was hardcoded in DashboardPage */
const SEED_ASSESSMENTS: DashboardAssessmentEntry[] = [
  { client: "Mira Al-Ali",     initials: "MA", date: "Jul 16, 2026", risk: "High",   status: "Flagged"  },
  { client: "Dana Al-Shamri",  initials: "DS", date: "Jul 15, 2026", risk: "Medium", status: "Pending"  },
  { client: "Lina Al-Zahrani", initials: "LZ", date: "Jul 14, 2026", risk: "Low",    status: "Reviewed" },
  { client: "Hana Al-Qahtani", initials: "HQ", date: "Jul 14, 2026", risk: "Medium", status: "Pending"  },
  { client: "Salma Al-Dosari", initials: "SD", date: "Jul 13, 2026", risk: "High",   status: "Flagged"  },
];

// ─── Mutable store ─────────────────────────────────────────────────────────────

interface StoreState {
  totalClients: number;
  pendingAssessments: number;
  assessmentEntries: DashboardAssessmentEntry[];
}

let _state: StoreState = {
  totalClients:      MOCK_CLIENTS.length,
  pendingAssessments: BASE_PENDING_ASSESSMENTS,
  assessmentEntries: SEED_ASSESSMENTS,
};

const _listeners = new Set<() => void>();

function _notify() {
  // Snapshot must be a new reference so useSyncExternalStore detects the change
  _state = { ..._state };
  _listeners.forEach((fn) => fn());
}

/** useSyncExternalStore subscribe */
export function dashboardSubscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

/** useSyncExternalStore getSnapshot */
export function getDashboardSnapshot(): StoreState {
  return _state;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Increments the total client count by 1.
 * TODO Supabase: await supabase.rpc('increment_client_count')
 */
export function incrementClients(): void {
  _state = { ..._state, totalClients: _state.totalClients + 1 };
  _notify();
}

/**
 * Increments the pending assessment counter by 1.
 * TODO Supabase: await supabase.rpc('increment_pending_assessments')
 */
export function incrementAssessmentRequests(): void {
  _state = { ..._state, pendingAssessments: _state.pendingAssessments + 1 };
  _notify();
}

/**
 * Prepends a new entry to the Recent Assessment Requests table.
 * Keeps the list capped at 20 entries.
 * TODO Supabase: await supabase.from('dashboard_assessment_queue').insert(entry)
 */
export function addAssessmentEntry(entry: DashboardAssessmentEntry): void {
  const entries = [entry, ..._state.assessmentEntries].slice(0, 20);
  _state = { ..._state, assessmentEntries: entries };
  _notify();
}

/**
 * Updates risk counters (future use — risk breakdown widget).
 * TODO Supabase: await supabase.rpc('update_risk_counters', { risk_level: level })
 */
export function updateRiskCounters(_level: RiskLevel): void {
  // No-op in mock layer; tracked via assessmentEntries risk distribution
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Reactive hook for DashboardPage.
 * Subscribes to store mutations and re-renders automatically.
 */
export function useDashboardStore(): StoreState {
  return useSyncExternalStore(dashboardSubscribe, getDashboardSnapshot);
}
