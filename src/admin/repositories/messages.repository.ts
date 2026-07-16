/**
 * messages.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the messages table.
 * Public website contact form writes here via the anon key (RLS: anon INSERT).
 */

import { supabase } from "@/lib/supabase";
import type { MessageRow } from "@/types/database.types";

export type { MessageRow as Message };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getMessages(limit = 50): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[messages] getMessages:", error.message); return []; }
  return data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");
  if (error) { console.error("[messages] getUnreadCount:", error.message); return 0; }
  return count ?? 0;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Called from the public contact form — works with the anon key (INSERT-only RLS). */
export async function sendMessage(msg: {
  sender_name: string;
  sender_email?: string;
  sender_phone?: string;
  content: string;
  source?: MessageRow["source"];
}): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .insert({ ...msg, status: "unread", source: msg.source ?? "website" });
  if (error) { console.error("[messages] sendMessage:", error.message); return false; }
  return true;
}

export async function markMessageRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("id", id);
  if (error) { console.error("[messages] markMessageRead:", error.message); return false; }
  return true;
}

export async function markMessageReplied(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .update({ status: "replied" })
    .eq("id", id);
  if (error) { console.error("[messages] markMessageReplied:", error.message); return false; }
  return true;
}
