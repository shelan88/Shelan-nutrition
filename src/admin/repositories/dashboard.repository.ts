/**
 * dashboard.repository.ts — SHELAN Admin Portal
 *
 * Live-query hook for dashboard stats.
 * Fetches from Supabase on mount; falls back to MOCK_CLIENTS data
 * when Supabase is not configured.
 *
 * Mutation helpers (incrementClients, addAssessmentEntry, …) are kept
 * as no-ops so AssessmentWizard can continue calling them without
 * changes — the dashboard will pick up fresh data on next mount.
 */

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_CLIENTS } from "@/admin/data/clients";
import type { RiskLevel } from "@/admin/data/clients";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardAssessmentEntry {
  client:   string;
  initials: string;
  date:     string;
  risk:     RiskLevel;
  status:   "Pending" | "Reviewed" | "Flagged";
}

export interface DashboardStats {
  totalClients:       number;
  pendingAssessments: number;
  assessmentEntries:  DashboardAssessmentEntry[];
  newClientsThisMonth: number;
}

// ─── Seed fallback (used when Supabase is not configured) ─────────────────────

const BASE_PENDING_ASSESSMENTS = 7;

const SEED_ASSESSMENTS: DashboardAssessmentEntry[] = [
  { client: "Mira Al-Ali",     initials: "MA", date: "Jul 16, 2026", risk: "High",   status: "Flagged"  },
  { client: "Dana Al-Shamri",  initials: "DS", date: "Jul 15, 2026", risk: "Medium", status: "Pending"  },
  { client: "Lina Al-Zahrani", initials: "LZ", date: "Jul 14, 2026", risk: "Low",    status: "Reviewed" },
  { client: "Hana Al-Qahtani", initials: "HQ", date: "Jul 14, 2026", risk: "Medium", status: "Pending"  },
  { client: "Salma Al-Dosari", initials: "SD", date: "Jul 13, 2026", risk: "High",   status: "Flagged"  },
];

function _getNewThisMonthFromMock(): number {
  const now = new Date();
  return MOCK_CLIENTS.filter((c) => {
    const d = new Date(c.joinedDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

function _mockStats(): DashboardStats {
  return {
    totalClients:        MOCK_CLIENTS.length,
    pendingAssessments:  BASE_PENDING_ASSESSMENTS,
    assessmentEntries:   SEED_ASSESSMENTS,
    newClientsThisMonth: _getNewThisMonthFromMock(),
  };
}

// ─── Live fetcher ─────────────────────────────────────────────────────────────

async function fetchDashboardStats(): Promise<DashboardStats> {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  // Run all queries in parallel
  const [clientsRes, newRes, assessmentsRes, recentRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).gte("join_date", monthStart),
    supabase.from("assessments").select("id", { count: "exact", head: true }),
    supabase
      .from("assessments")
      .select("id, risk_level, risk_percentage, submitted_at, clients(full_name, initials)")
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  const totalClients       = clientsRes.count       ?? MOCK_CLIENTS.length;
  const newClientsThisMonth = newRes.count           ?? _getNewThisMonthFromMock();
  const pendingAssessments  = assessmentsRes.count   ?? BASE_PENDING_ASSESSMENTS;

  const assessmentEntries: DashboardAssessmentEntry[] =
    recentRes.data?.map((a) => {
      const clientInfo = a.clients as { full_name?: string; initials?: string } | null;
      const riskRaw    = (a.risk_level ?? "low") as string;
      const risk: RiskLevel =
        riskRaw.toLowerCase() === "high"   ? "High"
        : riskRaw.toLowerCase() === "medium" ? "Medium"
        : "Low";
      return {
        client:   clientInfo?.full_name ?? "Unknown",
        initials: clientInfo?.initials  ?? "??",
        date:     new Date(a.submitted_at).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        risk,
        status: risk === "High" ? "Flagged" : "Pending",
      };
    }) ?? SEED_ASSESSMENTS;

  return { totalClients, pendingAssessments, assessmentEntries, newClientsThisMonth };
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Reactive hook for DashboardPage.
 * Fetches live counts from Supabase; falls back to mock data.
 */
export function useDashboardStore(): DashboardStats & { loading: boolean } {
  const [stats, setStats]   = useState<DashboardStats>(_mockStats);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    setLoading(true);
    fetchDashboardStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch((err) => console.error("[dashboard] fetchStats:", err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { ...stats, loading };
}

// ─── Mutation no-ops ──────────────────────────────────────────────────────────
// Kept for backward-compat with AssessmentWizard. Dashboard re-fetches on mount.

/** No-op: client count re-fetched from DB on next dashboard mount. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function incrementClients(): void {}

/** No-op: assessment count re-fetched from DB on next dashboard mount. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function incrementAssessmentRequests(): void {}

/** No-op: recent assessments re-fetched from DB on next dashboard mount. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addAssessmentEntry(_entry: DashboardAssessmentEntry): void {}

/** No-op: risk distribution re-fetched from DB on next dashboard mount. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateRiskCounters(_level: RiskLevel): void {}
