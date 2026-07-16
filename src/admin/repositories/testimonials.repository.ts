/**
 * testimonials.repository.ts — SHELAN Admin Portal
 *
 * Thin Supabase wrapper for the testimonials table.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TestimonialRow } from "@/types/database.types";

export type { TestimonialRow as Testimonial };

// ─── Public read ──────────────────────────────────────────────────────────────

export async function getPublishedTestimonials(): Promise<TestimonialRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) { console.error("[testimonials] getPublishedTestimonials:", error.message); return []; }
  return data ?? [];
}

// ─── Admin read ───────────────────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<TestimonialRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[testimonials] getAllTestimonials:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createTestimonial(
  t: Omit<TestimonialRow, "id" | "created_at" | "updated_at">,
): Promise<TestimonialRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("testimonials")
    .insert(t)
    .select()
    .single();
  if (error) { console.error("[testimonials] createTestimonial:", error.message); return null; }
  return data;
}

export async function updateTestimonial(
  id: string,
  updates: Partial<TestimonialRow>,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from("testimonials").update(updates).eq("id", id);
  if (error) { console.error("[testimonials] updateTestimonial:", error.message); return false; }
  return true;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) { console.error("[testimonials] deleteTestimonial:", error.message); return false; }
  return true;
}
