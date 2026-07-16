/**
 * dashboard.repository.ts — SHELAN Admin Portal
 *
 * Live-query hook for all dashboard data.
 * Fetches from Supabase on mount — no mock fallbacks.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
  totalClients:        number;
  pendingAssessments:  number;
  assessmentEntries:   DashboardAssessmentEntry[];
  newClientsThisMonth: number;
  appointmentsToday:   number;
  unreadMessages:      number;
}

export interface TodayAppointment {
  time:    string;
  client:  string;
  service: string;
  status:  "confirmed" | "in-progress" | "upcoming";
}

export interface DashboardMessage {
  id:       string;
  initials: string;
  name:     string;
  preview:  string;
  time:     string;
  unread:   boolean;
  gradient: string;
}

// ─── Gradient pool for message avatars ────────────────────────────────────────
const MSG_GRADIENTS = [
  "bg-gradient-to-br from-primary-pink to-soft-pink",
  "bg-gradient-to-br from-lavender-purple to-soft-purple",
  "bg-gradient-to-br from-soft-purple to-deep-purple",
  "bg-gradient-to-br from-primary-pink to-lavender-purple",
  "bg-gradient-to-br from-soft-pink to-primary-pink",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60)  return `${mins}m`;
  if (hours < 24)  return `${hours}h`;
  return `${days}d`;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchStats(): Promise<DashboardStats> {
  const now        = new Date();
  const today      = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [clientsRes, newRes, assessmentsRes, recentRes, apptTodayRes, unreadRes] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }).gte("join_date", monthStart),
      supabase.from("assessments").select("id", { count: "exact", head: true }),
      supabase
        .from("assessments")
        .select("id, risk_level, risk_percentage, submitted_at, clients(full_name, initials)")
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("date", today),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
    ]);

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
    }) ?? [];

  return {
    totalClients:        clientsRes.count       ?? 0,
    newClientsThisMonth: newRes.count            ?? 0,
    pendingAssessments:  assessmentsRes.count    ?? 0,
    assessmentEntries,
    appointmentsToday:   apptTodayRes.count      ?? 0,
    unreadMessages:      unreadRes.count         ?? 0,
  };
}

async function fetchTodaySchedule(): Promise<TodayAppointment[]> {
  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const { data, error } = await supabase
    .from("appointments")
    .select("time, client_name, type, status")
    .eq("date", today)
    .order("time", { ascending: true })
    .limit(8);

  if (error) {
    console.error("[dashboard] fetchTodaySchedule:", error.message);
    return [];
  }

  return (data ?? []).map((appt) => {
    // Parse time (e.g. "09:00 AM") to minutes for in-progress detection
    let apptMins = -1;
    if (appt.time) {
      const match = appt.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const ampm = (match[3] ?? "").toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        apptMins = h * 60 + m;
      }
    }

    let displayStatus: TodayAppointment["status"] = "upcoming";
    if (appt.status === "confirmed" || appt.status === "scheduled") {
      // Mark as in-progress if within 30 min window
      if (apptMins >= 0 && nowMins >= apptMins && nowMins < apptMins + 30) {
        displayStatus = "in-progress";
      } else if (apptMins >= 0 && nowMins >= apptMins) {
        displayStatus = "confirmed";
      } else {
        displayStatus = "upcoming";
      }
    } else if (appt.status === "completed") {
      displayStatus = "confirmed";
    }

    return {
      time:    appt.time ?? "",
      client:  appt.client_name ?? "Unknown",
      service: appt.type ?? "Consultation",
      status:  displayStatus,
    };
  });
}

async function fetchRecentMessages(): Promise<DashboardMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_name, content, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[dashboard] fetchRecentMessages:", error.message);
    return [];
  }

  return (data ?? []).map((msg, i) => ({
    id:       msg.id,
    initials: initials(msg.sender_name),
    name:     msg.sender_name,
    preview:  msg.content?.slice(0, 80) ?? "",
    time:     relativeTime(msg.created_at),
    unread:   msg.status === "unread",
    gradient: MSG_GRADIENTS[i % MSG_GRADIENTS.length],
  }));
}

// ─── React hook ───────────────────────────────────────────────────────────────

interface DashboardData extends DashboardStats {
  loading:          boolean;
  todaySchedule:    TodayAppointment[];
  recentMessages:   DashboardMessage[];
}

export function useDashboardStore(): DashboardData {
  const [stats, setStats]       = useState<DashboardStats>({
    totalClients: 0, pendingAssessments: 0, assessmentEntries: [],
    newClientsThisMonth: 0, appointmentsToday: 0, unreadMessages: 0,
  });
  const [todaySchedule,  setTodaySchedule]  = useState<TodayAppointment[]>([]);
  const [recentMessages, setRecentMessages] = useState<DashboardMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchStats(), fetchTodaySchedule(), fetchRecentMessages()])
      .then(([s, schedule, messages]) => {
        if (cancelled) return;
        setStats(s);
        setTodaySchedule(schedule);
        setRecentMessages(messages);
      })
      .catch((err) => console.error("[dashboard] load:", err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { ...stats, loading, todaySchedule, recentMessages };
}

// ─── Mutation no-ops (kept for backward-compat with AssessmentWizard) ─────────
// Dashboard re-fetches fresh data on next mount.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function incrementClients(): void {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function incrementAssessmentRequests(): void {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addAssessmentEntry(_entry: DashboardAssessmentEntry): void {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateRiskCounters(_level: RiskLevel): void {}
