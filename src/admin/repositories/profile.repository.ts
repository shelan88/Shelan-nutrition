/**
 * profile.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the admin_profiles table.
 * Each admin user has one row linked to a Supabase Auth user_id.
 */

import { supabase } from "@/lib/supabase";
import type { AdminProfileRow } from "@/types/database.types";
import { uploadToStorage } from "@/lib/upload";
import { dbg, dbgOk, dbgError } from "@/shared/debug/uploadDebug";

export type { AdminProfileRow as AdminProfile };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAdminProfile(id: string): Promise<AdminProfileRow | null> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[profile] getAdminProfile:", error.message); return null; }
  return data;
}

export async function getAllAdminProfiles(): Promise<AdminProfileRow[]> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) { console.error("[profile] getAllAdminProfiles:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createAdminProfile(
  profile: Omit<AdminProfileRow, "id" | "created_at" | "updated_at">,
): Promise<AdminProfileRow | null> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .insert(profile)
    .select()
    .single();
  if (error) { console.error("[profile] createAdminProfile:", error.message); return null; }
  return data;
}

export async function updateAdminProfile(
  id: string,
  updates: Partial<AdminProfileRow>,
): Promise<boolean> {
  const { error } = await supabase
    .from("admin_profiles")
    .update(updates)
    .eq("id", id);
  if (error) { console.error("[profile] updateAdminProfile:", error.message); return false; }
  return true;
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

/**
 * Upload an admin profile avatar to Supabase Storage and persist the URL.
 *
 * Path:    media/admin-avatars/{userId}/avatar.jpg  (always .jpg after compression)
 * Upsert:  true — replaces the previous file at the same path; no orphaned files.
 * Logging: every step emitted via dbg/dbgOk/dbgError so the debug panel captures it.
 *
 * Returns the public URL on success, or null on any failure.
 */
export async function uploadAdminAvatar(
  userId: string,
  file: File,
): Promise<string | null> {
  dbg("adminAvatar:uploadStarted", `userId="${userId}" file="${file.name}" size=${file.size}B type="${file.type || "(empty)"}"`);

  // Always store as avatar.jpg — uploadToStorage compress:true converts to JPEG,
  // so upsert at the same path always replaces the previous file cleanly.
  const path = `admin-avatars/${userId}/avatar.jpg`;
  dbg("adminAvatar:storagePath", path);

  const { url, error: uploadErr } = await uploadToStorage(file, {
    path,
    upsert:       true,
    compress:     true,
    maxWidthPx:   400,
    quality:      0.88,
    maxSizeMb:    5,
    allowedTypes: ["image/*"],
    cacheControl: "1",  // very short TTL — browser must revalidate every request
  });

  if (uploadErr || !url) {
    dbgError("adminAvatar:storageFailed", uploadErr ?? "No URL returned from storage");
    return null;
  }
  dbgOk("adminAvatar:storageComplete", `url="${url.slice(0, 80)}"`);

  // Persist to admin_profiles row
  dbg("adminAvatar:dbUpdate", `admin_profiles where user_id="${userId}"`);
  const { error: dbErr } = await supabase
    .from("admin_profiles")
    .update({ avatar_url: url })
    .eq("user_id", userId);

  if (dbErr) {
    dbgError("adminAvatar:dbUpdateFailed", dbErr.message);
    return null;
  }
  dbgOk("adminAvatar:dbUpdated", "avatar_url persisted in admin_profiles");

  return url;
}
