/**
 * progress.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for progress_entries and progress_photos tables.
 * Also handles timeline event insertion on create.
 *
 * Storage operations use the unified upload service from @/lib/upload.
 */

import { supabase } from "@/lib/supabase";
import { uploadToStorage, deleteFromStorage, safeName } from "@/lib/upload";
import { appendTimelineEvent } from "@/admin/repositories/clients.repository";
import type { ProgressEntryRow, ProgressPhotoRow } from "@/types/database.types";

export type { ProgressEntryRow, ProgressPhotoRow };

// ─── BMI helper ───────────────────────────────────────────────────────────────

export function calcBMI(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface ProgressEntryInput {
  entry_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  thigh_cm: number | null;
  arm_cm: number | null;
  chest_cm: number | null;
  body_fat_pct: number | null;
  muscle_mass_pct: number | null;
  water_pct: number | null;
  goal_weight_kg: number | null;
  nutritionist_notes: string;
  client_notes: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getClientProgressEntries(
  clientId: string,
): Promise<ProgressEntryRow[]> {
  const { data, error } = await supabase
    .from("progress_entries")
    .select("*")
    .eq("client_id", clientId)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("[progress] getClientProgressEntries:", error.message);
    return [];
  }
  return (data ?? []) as ProgressEntryRow[];
}

export async function getEntryPhotos(
  entryId: string,
): Promise<ProgressPhotoRow[]> {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at");

  if (error) {
    console.error("[progress] getEntryPhotos:", error.message);
    return [];
  }
  return (data ?? []) as ProgressPhotoRow[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProgressEntry(
  clientId: string,
  input: ProgressEntryInput,
  previousWeight: number | null = null,
): Promise<ProgressEntryRow | null> {
  const bmi = calcBMI(input.weight_kg, input.height_cm);

  const { data, error } = await supabase
    .from("progress_entries")
    .insert({
      client_id:          clientId,
      entry_date:         input.entry_date,
      weight_kg:          input.weight_kg,
      height_cm:          input.height_cm,
      bmi,
      waist_cm:           input.waist_cm,
      hip_cm:             input.hip_cm,
      thigh_cm:           input.thigh_cm,
      arm_cm:             input.arm_cm,
      chest_cm:           input.chest_cm,
      body_fat_pct:       input.body_fat_pct,
      muscle_mass_pct:    input.muscle_mass_pct,
      water_pct:          input.water_pct,
      goal_weight_kg:     input.goal_weight_kg,
      nutritionist_notes: input.nutritionist_notes || null,
      client_notes:       input.client_notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[progress] createProgressEntry:", error.message);
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  let eventText   = "Progress Recorded";
  let eventTextAr = "تم تسجيل التقدم";

  if (input.weight_kg && previousWeight) {
    eventText   = `Progress Recorded · Weight ${previousWeight} → ${input.weight_kg} kg`;
    eventTextAr = `تم تسجيل التقدم · الوزن ${previousWeight} → ${input.weight_kg} كجم`;
  } else if (input.weight_kg) {
    eventText   = `Progress Recorded · Weight ${input.weight_kg} kg`;
    eventTextAr = `تم تسجيل التقدم · الوزن ${input.weight_kg} كجم`;
  }

  await appendTimelineEvent(clientId, {
    event:   eventText,
    eventAr: eventTextAr,
    date:    today,
    type:    "plan",
  });

  return data as ProgressEntryRow;
}

export async function updateProgressEntry(
  entryId: string,
  input: ProgressEntryInput,
): Promise<ProgressEntryRow | null> {
  const bmi = calcBMI(input.weight_kg, input.height_cm);

  const { data, error } = await supabase
    .from("progress_entries")
    .update({
      entry_date:         input.entry_date,
      weight_kg:          input.weight_kg,
      height_cm:          input.height_cm,
      bmi,
      waist_cm:           input.waist_cm,
      hip_cm:             input.hip_cm,
      thigh_cm:           input.thigh_cm,
      arm_cm:             input.arm_cm,
      chest_cm:           input.chest_cm,
      body_fat_pct:       input.body_fat_pct,
      muscle_mass_pct:    input.muscle_mass_pct,
      water_pct:          input.water_pct,
      goal_weight_kg:     input.goal_weight_kg,
      nutritionist_notes: input.nutritionist_notes || null,
      client_notes:       input.client_notes || null,
    })
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    console.error("[progress] updateProgressEntry:", error.message);
    return null;
  }
  return data as ProgressEntryRow;
}

export async function duplicateProgressEntry(
  source: ProgressEntryRow,
): Promise<ProgressEntryRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  const input: ProgressEntryInput = {
    entry_date:         today,
    weight_kg:          source.weight_kg,
    height_cm:          source.height_cm,
    waist_cm:           source.waist_cm,
    hip_cm:             source.hip_cm,
    thigh_cm:           source.thigh_cm,
    arm_cm:             source.arm_cm,
    chest_cm:           source.chest_cm,
    body_fat_pct:       source.body_fat_pct,
    muscle_mass_pct:    source.muscle_mass_pct,
    water_pct:          source.water_pct,
    goal_weight_kg:     source.goal_weight_kg,
    nutritionist_notes: source.nutritionist_notes ?? "",
    client_notes:       source.client_notes ?? "",
  };
  return createProgressEntry(source.client_id, input);
}

export async function deleteProgressEntry(entryId: string): Promise<boolean> {
  const { error } = await supabase
    .from("progress_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("[progress] deleteProgressEntry:", error.message);
    return false;
  }
  return true;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function uploadEntryPhoto(
  entryId: string,
  clientId: string,
  photoType: ProgressPhotoRow["photo_type"],
  file: File,
): Promise<ProgressPhotoRow | null> {
  const path = `progress/${clientId}/${entryId}/${photoType}_${Date.now()}_${safeName(file.name)}`;

  const { url: publicUrl, error: uploadError } = await uploadToStorage(file, {
    path,
    upsert:      true,
    compress:    true,
    maxWidthPx:  1200,
    allowedTypes: ["image/*"],
  });

  if (uploadError || !publicUrl) {
    console.error("[progress] uploadEntryPhoto:", uploadError);
    return null;
  }

  // Replace existing photo of same type for this entry
  const { data: existing } = await supabase
    .from("progress_photos")
    .select("id, url")
    .eq("entry_id", entryId)
    .eq("photo_type", photoType);

  if (existing && existing.length > 0) {
    for (const ex of existing) {
      await deleteEntryPhoto(ex.id, ex.url);
    }
  }

  const { data, error: dbError } = await supabase
    .from("progress_photos")
    .insert({
      entry_id:   entryId,
      client_id:  clientId,
      photo_type: photoType,
      url:        publicUrl,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[progress] progress_photos insert:", dbError.message);
    return null;
  }
  return data as ProgressPhotoRow;
}

export async function deleteEntryPhoto(
  photoId: string,
  url: string,
): Promise<boolean> {
  await deleteFromStorage(url);

  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", photoId);

  if (error) { console.error("[progress] deleteEntryPhoto:", error.message); return false; }
  return true;
}
