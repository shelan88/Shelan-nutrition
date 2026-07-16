/**
 * clients.repository.ts — SHELAN Admin Portal
 *
 * In-memory singleton initialized from MOCK_CLIENTS.
 * Supports useSyncExternalStore for reactive React components.
 *
 * Supabase migration path:
 *   - Each function has a marked TODO showing the exact Supabase call to replace it with.
 *   - The function signature and return type stay the same — callers need zero changes.
 */

import { MOCK_CLIENTS } from "@/admin/data/clients";
import type {
  Client, RiskLevel, TimelineEvent, TimelineType, ClientStatus,
} from "@/admin/data/clients";
import type { AssessmentResult } from "@/admin/services/assessment.service";

// ─── Mutable in-memory store ───────────────────────────────────────────────────

let _clients: Client[] = [...MOCK_CLIENTS];
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

/** Subscribe to store changes — compatible with useSyncExternalStore */
export function subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

/** Snapshot for useSyncExternalStore */
export function getClientsSnapshot(): readonly Client[] {
  return _clients;
}

// ─── Read operations ───────────────────────────────────────────────────────────

/**
 * Returns all clients (sorted newest-first by joinedDate).
 * TODO Supabase: supabase.from('clients').select('*').order('joined_date', { ascending: false })
 */
export function getAllClients(): Client[] {
  return [..._clients].sort(
    (a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime(),
  );
}

/**
 * Returns a single client by ID, or null if not found.
 * TODO Supabase: supabase.from('clients').select('*').eq('id', id).single()
 */
export function getClient(id: string): Client | null {
  return _clients.find((c) => c.id === id) ?? null;
}

/**
 * Finds a client by email (case-insensitive).
 * TODO Supabase: supabase.from('clients').select('*').ilike('email', email).maybeSingle()
 */
export function findClientByEmail(email: string): Client | null {
  if (!email.trim()) return null;
  const q = email.toLowerCase().trim();
  return _clients.find((c) => c.email.toLowerCase() === q) ?? null;
}

/**
 * Finds a client by phone (strips spaces for comparison).
 * TODO Supabase: supabase.from('clients').select('*').eq('phone', normalise(phone)).maybeSingle()
 */
export function findClientByPhone(phone: string): Client | null {
  if (!phone.trim()) return null;
  const q = phone.replace(/\s/g, "");
  return _clients.find((c) => c.phone.replace(/\s/g, "") === q) ?? null;
}

// ─── Write operations ──────────────────────────────────────────────────────────

/**
 * Creates a new client from an assessment result.
 * Returns the created client.
 * TODO Supabase: supabase.from('clients').insert(data).select().single()
 */
export function createClient(result: AssessmentResult): Client {
  const now    = new Date();
  const id     = `c-${Date.now()}`;
  const today  = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const iso    = now.toISOString().slice(0, 10);

  const diagnoses    = _buildDiagnosisStrings(result);
  const riskIndicators = _buildRiskIndicators(result);

  const newClient: Client = {
    id,
    fullName:         result.fullName,
    fullNameAr:       result.fullName, // will be updated by admin if needed
    gender:           result.gender,
    age:              result.age,
    country:          result.country,
    countryAr:        result.countryAr,
    phone:            result.phone,
    email:            result.email,
    avatarInitials:   result.avatarInitials,
    avatarGradient:   result.avatarGradient,

    assessmentScore:  result.score,
    riskLevel:        result.riskLevel,
    currentPlan:      result.planEn,
    currentPlanAr:    result.planAr,
    lastAppointment:  today,
    status:           "Waiting" as const,
    joinedDate:       iso,

    diagnoses:        diagnoses.en,
    diagnosesAr:      diagnoses.ar,
    riskIndicators,
    medicalNotes:     "",
    medicalNotesAr:   "",
    privateNotes:     `Assessment submitted on ${today}. ${result.recommendation}`,
    privateNotesAr:   `تم تقديم التقييم في ${today}. ${result.recommendationAr}`,
    consultations:    [],
    nutritionPlan:    null,
    files:            [],

    timeline: [
      {
        id:      `t-${Date.now()}-1`,
        event:   "Assessment Submitted",
        eventAr: "تم تقديم التقييم",
        date:    today,
        type:    "assessment" as TimelineType,
      },
    ],

    assessment: {
      completedDate:        today,
      score:                result.score,
      riskPercentage:       result.riskPercentage,
      diagnosisCategory:    result.diagnosisCategory,
      diagnosisCategoryAr:  result.diagnosisCategoryAr,
    },
  };

  _clients = [newClient, ..._clients];
  _notify();
  return newClient;
}

/**
 * Saves a new assessment onto an existing client.
 * Updates score, risk, plan, diagnosis, and assessment details.
 * TODO Supabase: supabase.from('clients').update(patch).eq('id', clientId)
 */
export function saveAssessment(clientId: string, result: AssessmentResult): Client | null {
  const idx = _clients.findIndex((c) => c.id === clientId);
  if (idx === -1) return null;

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  _clients = _clients.map((c, i) => {
    if (i !== idx) return c;
    return {
      ...c,
      assessmentScore:  result.score,
      riskLevel:        result.riskLevel,
      currentPlan:      result.planEn,
      currentPlanAr:    result.planAr,
      lastAppointment:  today,
      status:           "Waiting" as ClientStatus,
      assessment: {
        completedDate:       today,
        score:               result.score,
        riskPercentage:      result.riskPercentage,
        diagnosisCategory:   result.diagnosisCategory,
        diagnosisCategoryAr: result.diagnosisCategoryAr,
      },
    };
  });
  _notify();
  return _clients[idx] ?? null;
}

/**
 * Updates arbitrary fields on an existing client.
 * TODO Supabase: supabase.from('clients').update(updates).eq('id', id)
 */
export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const idx = _clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  _clients = _clients.map((c, i) => (i === idx ? { ...c, ...updates } : c));
  _notify();
  return _clients[idx] ?? null;
}

/**
 * Appends a timeline event to an existing client.
 * TODO Supabase: supabase.from('timeline_events').insert({ client_id: clientId, ...event })
 */
export function appendTimelineEvent(
  clientId: string,
  event: Omit<TimelineEvent, "id">,
): void {
  const idx = _clients.findIndex((c) => c.id === clientId);
  if (idx === -1) return;
  const newEvent: TimelineEvent = { id: `t-${Date.now()}`, ...event };
  _clients = _clients.map((c, i) =>
    i === idx ? { ...c, timeline: [newEvent, ...c.timeline] } : c,
  );
  _notify();
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function _buildDiagnosisStrings(result: AssessmentResult): { en: string[]; ar: string[] } {
  const en: string[] = [result.diagnosisCategory];
  const ar: string[] = [result.diagnosisCategoryAr];
  if (result.bmi !== null) {
    en.push(`BMI: ${result.bmi}`);
    ar.push(`مؤشر كتلة الجسم: ${result.bmi}`);
  }
  return { en, ar };
}

function _buildRiskIndicators(result: AssessmentResult) {
  const level: "normal" | "warning" | "critical" =
    result.riskLevel === "High"   ? "critical"
    : result.riskLevel === "Medium" ? "warning"
    : "normal";

  const indicators = [];

  if (result.bmi !== null) {
    indicators.push({
      label:   "BMI",
      labelAr: "مؤشر كتلة الجسم",
      value:   String(result.bmi),
      level:   (result.bmi >= 30 ? "critical" : result.bmi >= 25 ? "warning" : "normal") as "normal" | "warning" | "critical",
    });
  }

  indicators.push({
    label:   "Risk Score",
    labelAr: "نقاط الخطر",
    value:   `${result.score}/100`,
    level,
  });

  return indicators;
}
