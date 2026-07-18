/**
 * portal/repositories/profile.repository.ts
 * Client-scoped profile read / update / avatar upload.
 *
 * ARCHITECTURE NOTES
 * ──────────────────
 * updateOwnProfile  → calls the SECURITY DEFINER RPC `update_own_client_profile`
 *                     which targets rows via auth.uid() inside the function body,
 *                     bypassing the RLS surface on the clients table entirely.
 *                     This eliminates the "0 rows" / RLS mismatch failures that
 *                     occur when the JS client calls .update().eq("id", …).single().
 *
 * uploadAvatar      → storage upload ONLY. Does NOT write to the clients table.
 *                     The caller (handleSave) passes the returned URL to
 *                     updateOwnProfile so both happen in one atomic RPC call.
 *
 * avatar_url in DB  → stored WITHOUT a cache-buster. Cache-busters are appended
 *                     at render time so stored URLs remain clean and reusable.
 */

import { supabase } from "@/lib/supabase";
import type { ClientRow } from "@/types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUpdate {
  full_name?:          string;
  phone?:              string | null;
  gender?:             "Female" | "Male" | "Other" | null;
  location?:           string | null;
  city?:               string | null;
  date_of_birth?:      string | null;   // "YYYY-MM-DD" or null
  preferred_language?: string;
  bio?:                string | null;
  avatar_url?:         string | null;   // null = keep existing
}

export interface ProfileUpdateResult {
  data:  ClientRow | null;
  error: string | null;
}

export interface AvatarUploadResult {
  url:   string | null;   // clean public URL (no cache-buster)
  error: string | null;
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

// ─── Update own profile (SECURITY DEFINER RPC) ───────────────────────────────
// Uses the update_own_client_profile RPC which targets the row via auth.uid()
// inside the function body — bypasses RLS entirely. Never hides the real error.

export async function updateOwnProfile(
  updates: ProfileUpdate,
): Promise<ProfileUpdateResult> {
  // Convert empty-string date to null so Postgres DATE cast doesn't fail
  const dob = updates.date_of_birth === "" ? null : (updates.date_of_birth ?? null);

  const { data, error } = await supabase.rpc("update_own_client_profile", {
    p_full_name:          updates.full_name          ?? null,
    p_phone:              updates.phone              ?? null,
    p_gender:             updates.gender             ?? null,
    p_location:           updates.location           ?? null,
    p_city:               updates.city               ?? null,
    p_date_of_birth:      dob,
    p_preferred_language: updates.preferred_language ?? "en",
    p_bio:                updates.bio                ?? null,
    p_avatar_url:         updates.avatar_url         ?? null, // null = keep existing
  });

  if (error) {
    console.error("[portal/profile] updateOwnProfile RPC error:", error.message, error.details, error.hint);
    return { data: null, error: error.message };
  }

  // RPC returns SETOF clients — Supabase JS returns an array
  const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  if (!row) {
    const msg = "Profile update returned no rows — user may not have a linked client record";
    console.error("[portal/profile]", msg);
    return { data: null, error: msg };
  }

  return { data: row as ClientRow, error: null };
}

// ─── Avatar upload (storage only) ─────────────────────────────────────────────
// Uploads the file to Supabase Storage and returns the clean public URL.
// Does NOT write to the clients table — pass the returned URL to updateOwnProfile.
// The URL is stored WITHOUT a cache-buster; add one at render time if needed.

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<AvatarUploadResult> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `avatars/${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, {
      upsert:       true,
      contentType:  file.type || "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[portal/profile] uploadAvatar storage error:", uploadError.message);
    return { url: null, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
  // Return the clean URL — no cache-buster — so the DB stores a stable value
  return { url: urlData.publicUrl, error: null };
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
