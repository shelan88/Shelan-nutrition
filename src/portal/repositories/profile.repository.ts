/**
 * portal/repositories/profile.repository.ts
 * Client-scoped profile read / update / avatar upload.
 * All writes are restricted to the authenticated user's own client row via RLS.
 */

import { supabase } from "@/lib/supabase";
import type { ClientRow } from "@/types/database.types";

// ─── Profile fields the client may edit ──────────────────────────────────────

export interface ProfileUpdate {
  full_name?:         string;
  phone?:             string;
  gender?:            "Female" | "Male" | "Other" | null;
  location?:          string;   // country
  city?:              string;
  date_of_birth?:     string;   // "YYYY-MM-DD"
  preferred_language?: string;
  bio?:               string;
  avatar_url?:        string;
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

export async function updateOwnProfile(
  clientId: string,
  updates: ProfileUpdate,
): Promise<ClientRow | null> {
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) {
    console.error("[portal/profile] updateOwnProfile:", error.message);
    return null;
  }
  return data as ClientRow;
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

export async function uploadAvatar(
  userId: string,
  clientId: string,
  file: File,
): Promise<string | null> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `avatars/${userId}/avatar.${ext}`;

  // Remove old avatar before uploading new one
  await supabase.storage.from("media").remove([path]);

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[portal/profile] uploadAvatar:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Persist avatar_url on the client row
  await supabase
    .from("clients")
    .update({ avatar_url: publicUrl })
    .eq("id", clientId);

  return publicUrl;
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
