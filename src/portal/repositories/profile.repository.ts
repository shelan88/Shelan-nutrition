/**
 * portal/repositories/profile.repository.ts
 * Client-scoped profile read / update / avatar upload.
 * All writes are restricted to the authenticated user's own client row via RLS.
 */

import { supabase } from "@/lib/supabase";
import type { ClientRow } from "@/types/database.types";

// ─── Profile fields the client may edit ──────────────────────────────────────

export interface ProfileUpdate {
  full_name?:          string;
  phone?:              string | null;
  gender?:             "Female" | "Male" | "Other" | null;
  location?:           string;   // country
  city?:               string;
  date_of_birth?:      string | null;   // "YYYY-MM-DD" or null
  preferred_language?: string;
  bio?:                string;
  avatar_url?:         string;
}

export interface ProfileUpdateResult {
  data:  ClientRow | null;
  error: string | null;
}

// ─── Sanitize updates before sending to Postgres ──────────────────────────────
// Empty strings are valid for TEXT columns but invalid for DATE/typed columns.
// Convert them to null so Postgres never sees "" for a DATE field.

function sanitize(updates: ProfileUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (k === "date_of_birth") {
      // DATE column — empty string would cause "invalid input syntax for type date"
      out[k] = typeof v === "string" && v.trim() === "" ? null : v;
    } else if (k === "phone") {
      // Store null instead of empty string for clean data
      out[k] = typeof v === "string" && v.trim() === "" ? null : v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ─── Read own profile ─────────────────────────────────────────────────────────

export async function getOwnProfile(): Promise<ClientRow | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("[portal/profile] getOwnProfile:", error.message);
    return null;
  }
  return data as ClientRow | null;
}

// ─── Update own profile ───────────────────────────────────────────────────────
// Returns the updated row on success, or an error message string on failure.
// Never hides the actual Postgres/RLS error.

export async function updateOwnProfile(
  clientId: string,
  updates: ProfileUpdate,
): Promise<ProfileUpdateResult> {
  const payload = sanitize(updates);

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) {
    console.error("[portal/profile] updateOwnProfile:", error.message, error.details, error.hint);
    return { data: null, error: error.message };
  }
  return { data: data as ClientRow, error: null };
}

// ─── Avatar upload ────────────────────────────────────────────────────────────
// Uploads to media/avatars/{userId}/avatar.{ext} and returns the public URL.
// The upload uses upsert:true so repeated uploads overwrite cleanly.
// Returns { url, error } — never throws; caller decides how to surface errors.

export async function uploadAvatar(
  userId: string,
  clientId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `avatars/${userId}/avatar.${ext}`;

  // Upsert the file (overwrite if same extension, no prior-remove needed)
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, {
      upsert:      true,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[portal/profile] uploadAvatar storage error:", uploadError.message);
    return { url: null, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
  // Append a cache-buster so the browser reloads the new image immediately
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Persist avatar_url on the client row
  const { error: updateError } = await supabase
    .from("clients")
    .update({ avatar_url: publicUrl })
    .eq("id", clientId);

  if (updateError) {
    console.error("[portal/profile] uploadAvatar row update error:", updateError.message);
    // The file was uploaded successfully; return the URL even if the row update had a hiccup
    return { url: publicUrl, error: updateError.message };
  }

  return { url: publicUrl, error: null };
}

// ─── Delete account (soft — marks Inactive + clears user_id link) ─────────────

export async function deactivateOwnAccount(clientId: string): Promise<boolean> {
  const { error } = await supabase
    .from("clients")
    .update({ status: "Inactive", user_id: null })
    .eq("id", clientId);

  if (error) {
    console.error("[portal/profile] deactivateOwnAccount:", error.message);
    return false;
  }

  await supabase.auth.signOut();
  return true;
}
