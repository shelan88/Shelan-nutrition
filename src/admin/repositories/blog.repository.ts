/**
 * blog.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the blog_posts table.
 * Public selects only published posts; admin can manage all.
 */

import { supabase } from "@/lib/supabase";
import type { BlogPostRow } from "@/types/database.types";

export type { BlogPostRow as BlogPost };

// ─── Public read (no auth required) ──────────────────────────────────────────

export async function getPublishedPosts(limit = 20): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[blog] getPublishedPosts:", error.message); return []; }
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) { console.error("[blog] getPostBySlug:", error.message); return null; }
  return data;
}

// ─── Admin read (all posts) ────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[blog] getAllPosts:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createPost(
  post: Omit<BlogPostRow, "id" | "created_at" | "updated_at">,
): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(post)
    .select()
    .single();
  if (error) { console.error("[blog] createPost:", error.message); return null; }
  return data;
}

export async function updatePost(id: string, updates: Partial<BlogPostRow>): Promise<boolean> {
  const { error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id);
  if (error) { console.error("[blog] updatePost:", error.message); return false; }
  return true;
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) { console.error("[blog] deletePost:", error.message); return false; }
  return true;
}
