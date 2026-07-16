/**
 * faqs.repository.ts — SHELAN Admin Portal
 * Supabase wrapper for the faqs table.
 */
import { supabase } from "@/lib/supabase";
import type { FAQRow } from "@/types/database.types";

export type { FAQRow as FAQ };

export async function getAllFAQs(): Promise<FAQRow[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) { console.error("[faqs] getAllFAQs:", error.message); return []; }
  return data ?? [];
}

export async function getPublishedFAQs(category?: string): Promise<FAQRow[]> {
  let q = supabase.from("faqs").select("*").eq("published", true).order("sort_order", { ascending: true });
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) { console.error("[faqs] getPublishedFAQs:", error.message); return []; }
  return data ?? [];
}

export async function createFAQ(
  faq: Omit<FAQRow, "id" | "created_at">,
): Promise<FAQRow | null> {
  const { data, error } = await supabase.from("faqs").insert(faq).select().single();
  if (error) { console.error("[faqs] createFAQ:", error.message); return null; }
  return data;
}

export async function updateFAQ(
  id: string,
  updates: Partial<FAQRow>,
): Promise<boolean> {
  const { error } = await supabase.from("faqs").update(updates).eq("id", id);
  if (error) { console.error("[faqs] updateFAQ:", error.message); return false; }
  return true;
}

export async function deleteFAQ(id: string): Promise<boolean> {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) { console.error("[faqs] deleteFAQ:", error.message); return false; }
  return true;
}
