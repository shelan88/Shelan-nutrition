/**
 * clients.repository.ts — SHELAN Admin Portal
 *
 * Supabase-backed async repository for the clients table.
 * Falls back to MOCK_CLIENTS when Supabase is not yet configured
 * (e.g. before the schema is applied or env vars are missing).
 *
 * All exported function signatures remain identical to the previous
 * in-memory version — callers need only add `await`.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_CLIENTS } from "@/admin/data/clients";

// ─── In-memory fallback store (used when Supabase is not configured) ───────────
// Starts as a copy of MOCK_CLIENTS so reads + writes work consistently offline.
let _mockStore: Client[] = [...MOCK_CLIENTS];
import type {
  Client, RiskLevel, TimelineEvent, TimelineType,
  ClientStatus, Gender, FileType, NutritionPlan,
} from "@/admin/data/clients";
import type { AssessmentResult } from "@/admin/services/assessment.service";

// ─── Country lookup for AR labels ─────────────────────────────────────────────
const COUNTRY_AR: Record<string, string> = {
  "Kuwait":       "الكويت",
  "Saudi Arabia": "المملكة العربية السعودية",
  "UAE":          "الإمارات العربية المتحدة",
  "Bahrain":      "البحرين",
  "Qatar":        "قطر",
  "Jordan":       "الأردن",
  "Oman":         "عُمان",
  "Egypt":        "مصر",
  "Lebanon":      "لبنان",
};

// ─── Row → Client mapper ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToClient(row: any): Client {
  // Nested selects return arrays, ordered by their default sort
  const latestAssessment  = (row.assessments   as any[])?.[0] ?? null;
  const nutritionPlanRow  = (row.nutrition_plans as any[])?.[0] ?? null;
  const timelineRows      = (row.timeline_events as any[]) ?? [];
  const fileRows          = (row.uploaded_files  as any[]) ?? [];

  const country    = row.location   ?? "";
  const countryAr  = COUNTRY_AR[country] ?? country;

  return {
    id:              row.id,
    fullName:        row.full_name ?? "",
    fullNameAr:      row.full_name_ar ?? row.full_name ?? "",
    gender:          (row.gender   ?? "Female") as Gender,
    age:             row.age       ?? 0,
    country,
    countryAr,
    phone:           row.phone     ?? "",
    email:           row.email     ?? "",
    avatarInitials:  row.initials  ?? "",
    avatarGradient:  row.avatar_color ?? "bg-gradient-to-br from-primary-pink to-soft-pink",

    assessmentScore: latestAssessment?.score ?? null,
    riskLevel:       (row.risk_level ?? "Low") as RiskLevel,
    currentPlan:     latestAssessment?.diagnosis_category ?? "",
    currentPlanAr:   latestAssessment?.diagnosis_category_ar ?? "",
    lastAppointment: row.last_visit
      ? new Date(row.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    status:          (row.status ?? "Waiting") as ClientStatus,
    joinedDate:      row.join_date ?? row.created_at?.slice(0, 10) ?? "",

    diagnoses:       row.diagnosis_category    ? [row.diagnosis_category]    : [],
    diagnosesAr:     row.diagnosis_category_ar ? [row.diagnosis_category_ar] : [],
    riskIndicators:  Array.isArray(row.risk_indicators)  ? row.risk_indicators  : [],
    medicalNotes:    row.notes    ?? "",
    medicalNotesAr:  row.notes_ar ?? "",
    privateNotes:    "",
    privateNotesAr:  "",
    consultations:   Array.isArray(row.consultations) ? row.consultations : [],

    nutritionPlan: nutritionPlanRow
      ? (nutritionPlanRow.plan_data as NutritionPlan)
      : null,

    files: fileRows.map((f: any) => ({
      id:         f.id,
      name:       f.filename,
      type:       (f.type ?? "PDF") as FileType,
      size:       f.size ? `${(Number(f.size) / 1_048_576).toFixed(1)} MB` : "",
      uploadedAt: f.uploaded_at ?? "",
    })),

    timeline: [...timelineRows]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((t: any) => ({
        id:      t.id,
        event:   t.event,
        eventAr: t.event_ar ?? t.event,
        date:    t.date,
        type:    (t.type ?? "assessment") as TimelineType,
      })),

    assessment: latestAssessment
      ? {
          completedDate:       latestAssessment.submitted_at?.slice(0, 10) ?? "",
          score:               latestAssessment.score          ?? 0,
          riskPercentage:      latestAssessment.risk_percentage ?? 0,
          diagnosisCategory:   latestAssessment.diagnosis_category    ?? "",
          diagnosisCategoryAr: latestAssessment.diagnosis_category_ar ?? "",
        }
      : null,
  };
}

// Nested select string reused by getAllClients and getClient
const FULL_SELECT = `
  *,
  assessments(id, score, risk_level, risk_percentage, diagnosis_category, diagnosis_category_ar, submitted_at),
  timeline_events(id, event, event_ar, type, date),
  nutrition_plans(id, plan_data),
  uploaded_files(id, filename, type, size, uploaded_at)
`.trim();

// ─── Read operations ───────────────────────────────────────────────────────────

/**
 * Returns all clients sorted newest-first by join_date.
 */
export async function getAllClients(): Promise<Client[]> {
  if (!isSupabaseConfigured) return [..._mockStore];

  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .order("join_date", { ascending: false });

  if (error) {
    console.error("[clients] getAllClients:", error.message);
    return [..._mockStore]; // graceful fallback
  }

  return (data ?? []).map(mapRowToClient);
}

/**
 * Returns a single client by ID, or null if not found.
 */
export async function getClient(id: string): Promise<Client | null> {
  if (!isSupabaseConfigured) {
    return _mockStore.find((c) => c.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[clients] getClient:", error.message);
    return _mockStore.find((c) => c.id === id) ?? null;
  }

  return data ? mapRowToClient(data) : null;
}

/**
 * Finds a client by email (case-insensitive). Returns null if not found.
 */
export async function findClientByEmail(email: string): Promise<Client | null> {
  if (!email.trim()) return null;
  if (!isSupabaseConfigured) {
    const q = email.toLowerCase().trim();
    return _mockStore.find((c) => c.email.toLowerCase() === q) ?? null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) {
    console.error("[clients] findClientByEmail:", error.message);
    return null;
  }

  return data ? mapRowToClient(data) : null;
}

/**
 * Finds a client by phone. Returns null if not found.
 */
export async function findClientByPhone(phone: string): Promise<Client | null> {
  if (!phone.trim()) return null;
  if (!isSupabaseConfigured) {
    const q = phone.replace(/\s/g, "");
    return MOCK_CLIENTS.find((c) => c.phone.replace(/\s/g, "") === q) ?? null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .eq("phone", phone.replace(/\s/g, ""))
    .maybeSingle();

  if (error) {
    console.error("[clients] findClientByPhone:", error.message);
    return null;
  }

  return data ? mapRowToClient(data) : null;
}

// ─── Write operations ──────────────────────────────────────────────────────────

/**
 * Creates a new client from an assessment result.
 * Also creates the initial assessment row and first timeline event.
 */
export async function createClient(result: AssessmentResult): Promise<Client | null> {
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!isSupabaseConfigured) {
    // Offline fallback — build a minimal Client record and store in memory
    const mockClient: Client = {
      id:             `mock-${Date.now()}`,
      fullName:       result.fullName,
      fullNameAr:     result.fullName,
      gender:         (result.gender ?? "Female") as Gender,
      age:            result.age ?? 0,
      country:        result.country ?? "",
      countryAr:      COUNTRY_AR[result.country ?? ""] ?? result.country ?? "",
      phone:          result.phone ?? "",
      email:          result.email ?? "",
      avatarInitials: result.avatarInitials,
      avatarGradient: result.avatarGradient,
      assessmentScore: result.score,
      riskLevel:       result.riskLevel as RiskLevel,
      currentPlan:    result.diagnosisCategory,
      currentPlanAr:  result.diagnosisCategoryAr,
      lastAppointment: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status:          "Waiting" as ClientStatus,
      joinedDate:      today,
      diagnoses:       [result.diagnosisCategory],
      diagnosesAr:     [result.diagnosisCategoryAr],
      riskIndicators:  _buildRiskIndicators(result) as Client["riskIndicators"],
      medicalNotes:    "",
      medicalNotesAr:  "",
      privateNotes:    "",
      privateNotesAr:  "",
      consultations:   [],
      nutritionPlan:   null,
      timeline:        [{ id: `te-${Date.now()}`, event: "Assessment Submitted", eventAr: "تم تقديم التقييم", date: today, type: "assessment" as TimelineType }],
      files:           [],
      assessment: {
        completedDate:      today,
        score:              result.score,
        riskPercentage:     result.riskPercentage,
        diagnosisCategory:  result.diagnosisCategory,
        diagnosisCategoryAr: result.diagnosisCategoryAr,
      },
    };
    _mockStore = [mockClient, ..._mockStore];
    return mockClient;
  }

  // 1. Insert client
  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .insert({
      full_name:            result.fullName,
      email:                result.email     || null,
      phone:                result.phone?.replace(/\s/g, "") || null,
      age:                  result.age       || null,
      gender:               result.gender    || null,
      location:             result.country   || null,
      initials:             result.avatarInitials,
      avatar_color:         result.avatarGradient,
      bmi:                  result.bmi       || null,
      status:               "Waiting",
      risk_level:           result.riskLevel,
      risk_percentage:      result.riskPercentage,
      diagnosis_category:   result.diagnosisCategory,
      diagnosis_category_ar:result.diagnosisCategoryAr,
      join_date:            today,
      last_visit:           today,
      risk_indicators:      _buildRiskIndicators(result),
    })
    .select()
    .single();

  if (clientErr || !clientRow) {
    console.error("[clients] createClient insert:", clientErr?.message);
    return null;
  }

  const clientId = clientRow.id as string;

  // 2. Insert first assessment record
  await supabase.from("assessments").insert({
    client_id:             clientId,
    score:                 result.score,
    risk_level:            result.riskLevel,
    risk_percentage:       result.riskPercentage,
    diagnosis_category:    result.diagnosisCategory,
    diagnosis_category_ar: result.diagnosisCategoryAr,
  });

  // 3. Insert initial timeline event
  await supabase.from("timeline_events").insert({
    client_id: clientId,
    event:     "Assessment Submitted",
    event_ar:  "تم تقديم التقييم",
    type:      "assessment",
    date:      today,
  });

  return getClient(clientId);
}

/**
 * Saves a new assessment onto an existing client.
 * Updates the client row and inserts an assessment record.
 */
export async function saveAssessment(
  clientId: string,
  result: AssessmentResult,
): Promise<Client | null> {
  const today = new Date().toISOString().slice(0, 10);

  if (!isSupabaseConfigured) {
    // Offline: update the in-memory record
    _mockStore = _mockStore.map((c) =>
      c.id !== clientId ? c : {
        ...c,
        riskLevel:      result.riskLevel as RiskLevel,
        currentPlan:    result.diagnosisCategory,
        currentPlanAr:  result.diagnosisCategoryAr,
        assessmentScore: result.score,
        status:         "Waiting" as ClientStatus,
      },
    );
    return _mockStore.find((c) => c.id === clientId) ?? null;
  }

  // 1. Update client overview fields
  await supabase
    .from("clients")
    .update({
      risk_level:            result.riskLevel,
      risk_percentage:       result.riskPercentage,
      diagnosis_category:    result.diagnosisCategory,
      diagnosis_category_ar: result.diagnosisCategoryAr,
      status:                "Waiting",
      last_visit:            today,
    })
    .eq("id", clientId);

  // 2. Insert new assessment record
  await supabase.from("assessments").insert({
    client_id:             clientId,
    score:                 result.score,
    risk_level:            result.riskLevel,
    risk_percentage:       result.riskPercentage,
    diagnosis_category:    result.diagnosisCategory,
    diagnosis_category_ar: result.diagnosisCategoryAr,
  });

  return getClient(clientId);
}

/**
 * Updates arbitrary fields on an existing client.
 */
export async function updateClient(
  id: string,
  updates: Partial<Client>,
): Promise<Client | null> {
  if (!isSupabaseConfigured) {
    console.info("[clients] updateClient (mock fallback)");
    return null;
  }

  // Map camelCase Client fields to snake_case DB columns
  const dbUpdates: Record<string, unknown> = {};
  if (updates.fullName       !== undefined) dbUpdates.full_name        = updates.fullName;
  if (updates.fullNameAr     !== undefined) dbUpdates.full_name_ar     = updates.fullNameAr;
  if (updates.email          !== undefined) dbUpdates.email            = updates.email;
  if (updates.phone          !== undefined) dbUpdates.phone            = updates.phone;
  if (updates.age            !== undefined) dbUpdates.age              = updates.age;
  if (updates.gender         !== undefined) dbUpdates.gender           = updates.gender;
  if (updates.country        !== undefined) dbUpdates.location         = updates.country;
  if (updates.status         !== undefined) dbUpdates.status           = updates.status;
  if (updates.riskLevel      !== undefined) dbUpdates.risk_level       = updates.riskLevel;
  if (updates.medicalNotes   !== undefined) dbUpdates.notes            = updates.medicalNotes;
  if (updates.medicalNotesAr !== undefined) dbUpdates.notes_ar         = updates.medicalNotesAr;
  if (updates.consultations  !== undefined) dbUpdates.consultations    = updates.consultations;
  if (updates.riskIndicators !== undefined) dbUpdates.risk_indicators  = updates.riskIndicators;

  if (Object.keys(dbUpdates).length === 0) return getClient(id);

  const { error } = await supabase.from("clients").update(dbUpdates).eq("id", id);
  if (error) { console.error("[clients] updateClient:", error.message); return null; }

  return getClient(id);
}

/**
 * Appends a timeline event to an existing client.
 */
export async function appendTimelineEvent(
  clientId: string,
  event: Omit<TimelineEvent, "id">,
): Promise<void> {
  if (!isSupabaseConfigured) {
    // Offline: append event to the in-memory record's timeline
    _mockStore = _mockStore.map((c) =>
      c.id !== clientId ? c : {
        ...c,
        timeline: [
          ...c.timeline,
          { id: `te-${Date.now()}`, event: event.event, eventAr: event.eventAr ?? "", date: event.date, type: event.type },
        ],
      },
    );
    return;
  }

  const { error } = await supabase.from("timeline_events").insert({
    client_id: clientId,
    event:     event.event,
    event_ar:  event.eventAr,
    type:      event.type,
    date:      event.date,
  });

  if (error) {
    console.error("[clients] appendTimelineEvent:", error.message);
  }
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function _buildRiskIndicators(result: AssessmentResult) {
  const level: "normal" | "warning" | "critical" =
    result.riskLevel === "High"   ? "critical"
    : result.riskLevel === "Medium" ? "warning"
    : "normal";

  const indicators: Array<{ label: string; labelAr: string; value: string; level: string }> = [];

  if (result.bmi !== null && result.bmi !== undefined) {
    indicators.push({
      label:   "BMI",
      labelAr: "مؤشر كتلة الجسم",
      value:   String(result.bmi),
      level:   result.bmi >= 30 ? "critical" : result.bmi >= 25 ? "warning" : "normal",
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
