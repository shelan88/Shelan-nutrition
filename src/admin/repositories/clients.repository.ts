/**
 * clients.repository.ts — SHELAN Admin Portal
 *
 * Supabase-backed async repository for the clients table.
 * All functions go directly to Supabase — no mock fallbacks.
 */

import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type {
  Client, RiskLevel, TimelineEvent, TimelineType,
  ClientStatus, Gender, FileType,
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
  // assessment_responses is the canonical table (assessment unification fix).
  // Sort by submitted_at DESC so [0] is always the most recent submission.
  const assessmentRows = ((row.assessment_responses as any[]) ?? [])
    .filter((a: any) => a.status === "submitted" || a.score != null)
    .sort((a: any, b: any) =>
      new Date(b.submitted_at ?? b.created_at).getTime() -
      new Date(a.submitted_at ?? a.created_at).getTime()
    );
  const latestAssessment  = assessmentRows[0] ?? null;
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

    // Populate from joined nutrition_plans rows (new multi-column schema).
    // Show the single active plan (or latest draft/other if no active plan).
    // Full meal-level detail is loaded lazily by NutritionPlansTab.
    nutritionPlan: (() => {
      const plans = (row.nutrition_plans as any[]) ?? [];
      const pick =
        plans.find((p: any) => p.status === "active") ??
        plans.find((p: any) => p.status === "draft")  ??
        plans[0] ?? null;
      if (!pick) return null;
      return {
        planId:    pick.id,
        name:      pick.name ?? "",
        nameAr:    pick.name ?? "",     // no separate AR name column in v2 schema
        startDate: pick.start_date ?? "",
        endDate:   pick.end_date   ?? "",
        calories:  0,                   // calories not stored at plan level in v2
        macros:    [],                  // macros live inside the meals JSONB
        notes:     pick.general_instructions ?? "",
        notesAr:   pick.general_instructions ?? "",
        status:    pick.status ?? "draft",
      };
    })(),

    files: fileRows.map((f: any) => ({
      id:         f.id,
      name:       f.filename,
      type:       (f.type ?? "PDF") as FileType,
      size:       f.size ? `${(Number(f.size) / 1_048_576).toFixed(1)} MB` : "",
      uploadedAt: f.uploaded_at ?? "",
      url:        f.url ?? null,
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

// Nested select reused across read operations.
// Assessment data is now read from assessment_responses (canonical table after
// the unification migration). The legacy `assessments` table is no longer the
// source of truth for client assessment history or dashboard metrics.
const FULL_SELECT = `
  *,
  assessment_responses(id, score, risk_level, risk_percentage, diagnosis_category, diagnosis_category_ar, submitted_at, status),
  timeline_events(id, event, event_ar, type, date),
  nutrition_plans(id, name, status),
  uploaded_files(id, filename, type, size, url, uploaded_at)
`.trim();

// ─── Read operations ───────────────────────────────────────────────────────────

export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .order("join_date", { ascending: false });

  if (error) {
    console.error("[clients] getAllClients:", error.message);
    return [];
  }

  return (data ?? []).map(mapRowToClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[clients] getClient:", error.message);
    return null;
  }

  return data ? mapRowToClient(data) : null;
}

export async function findClientByEmail(email: string): Promise<Client | null> {
  if (!email.trim()) return null;

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

export async function findClientByPhone(phone: string): Promise<Client | null> {
  if (!phone.trim()) return null;

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
 * Creates a minimal client record from a Supabase auth user immediately after
 * sign-up or sign-in, so the user appears in the admin Clients list even before
 * they complete the full assessment wizard.
 *
 * Idempotent: does nothing if a client with that email already exists.
 */
export async function upsertClientFromAuth(user: SupabaseUser): Promise<void> {
  if (!user.email) return;

  const rawName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email.split("@")[0];

  const fullName = rawName.trim() || user.email.split("@")[0];

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("") || "?";

  const today = new Date().toISOString().slice(0, 10);

  // Uses a SECURITY DEFINER Postgres function so the upsert runs with elevated
  // privileges (bypasses RLS). This is required because:
  //   • INSERT: clients RLS only allows admins to insert rows.
  //   • Backfill UPDATE: a row with user_id IS NULL cannot be matched by the
  //     client's own UPDATE policy (USING: user_id = auth.uid()).
  // The function is safe: it only links the calling user's auth.uid() to a row
  // whose email matches, and only creates rows linked to that uid.
  // The RPC derives the caller's identity from auth.uid() / auth.email() inside
  // the Postgres function — no identity fields are passed as parameters.
  const { error } = await supabase.rpc("upsert_client_from_auth", {
    p_name:       fullName,
    p_initials:   initials,
    p_color:      "bg-gradient-to-br from-primary-pink to-soft-pink",
    p_status:     "Waiting",
    p_risk_level: "Low",
    p_join_date:  today,
  });

  if (error) {
    console.error("[clients] upsertClientFromAuth:", error.message);
  }
}

export async function createClient(result: AssessmentResult): Promise<Client | null> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .insert({
      full_name:             result.fullName,
      email:                 result.email     || null,
      phone:                 result.phone?.replace(/\s/g, "") || null,
      age:                   result.age       || null,
      gender:                result.gender    || null,
      location:              result.country   || null,
      initials:              result.avatarInitials,
      avatar_color:          result.avatarGradient,
      bmi:                   result.bmi       || null,
      status:                "Waiting",
      risk_level:            result.riskLevel,
      risk_percentage:       result.riskPercentage,
      diagnosis_category:    result.diagnosisCategory,
      diagnosis_category_ar: result.diagnosisCategoryAr,
      join_date:             today,
      last_visit:            today,
      risk_indicators:       _buildRiskIndicators(result),
    })
    .select()
    .single();

  if (clientErr || !clientRow) {
    console.error("[clients] createClient insert:", clientErr?.message);
    return null;
  }

  const clientId = clientRow.id as string;

  // Write to assessment_responses (canonical table after unification fix).
  // Use the well-known legacy template UUID so the NOT NULL FK is satisfied.
  const LEGACY_TEMPLATE_ID = "00000000-0000-0000-0000-000000000001";
  await supabase.from("assessment_responses").insert({
    template_id:           LEGACY_TEMPLATE_ID,
    client_id:             clientId,
    status:                "submitted",
    submitted_at:          new Date().toISOString(),
    score:                 result.score,
    risk_level:            result.riskLevel,
    risk_percentage:       result.riskPercentage,
    diagnosis_category:    result.diagnosisCategory,
    diagnosis_category_ar: result.diagnosisCategoryAr,
  });

  await supabase.from("timeline_events").insert({
    client_id: clientId,
    event:     "Assessment Submitted",
    event_ar:  "تم تقديم التقييم",
    type:      "assessment",
    date:      today,
  });

  return getClient(clientId);
}

export async function saveAssessment(
  clientId: string,
  result: AssessmentResult,
): Promise<Client | null> {
  const today = new Date().toISOString().slice(0, 10);

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

  // Write to assessment_responses (canonical table after unification fix).
  const LEGACY_TEMPLATE_ID = "00000000-0000-0000-0000-000000000001";
  await supabase.from("assessment_responses").insert({
    template_id:           LEGACY_TEMPLATE_ID,
    client_id:             clientId,
    status:                "submitted",
    submitted_at:          new Date().toISOString(),
    score:                 result.score,
    risk_level:            result.riskLevel,
    risk_percentage:       result.riskPercentage,
    diagnosis_category:    result.diagnosisCategory,
    diagnosis_category_ar: result.diagnosisCategoryAr,
  });

  return getClient(clientId);
}

export async function updateClient(
  id: string,
  updates: Partial<Client>,
): Promise<Client | null> {
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

export async function deleteClient(id: string): Promise<boolean> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) { console.error("[clients] deleteClient:", error.message); return false; }
  return true;
}

export async function archiveClient(id: string): Promise<boolean> {
  const { error } = await supabase.from("clients").update({ status: "Inactive" }).eq("id", id);
  if (error) { console.error("[clients] archiveClient:", error.message); return false; }
  return true;
}

export async function appendTimelineEvent(
  clientId: string,
  event: Omit<TimelineEvent, "id">,
): Promise<void> {
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
