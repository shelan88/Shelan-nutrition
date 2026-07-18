/**
 * Question Library Repository
 *
 * Persists the reusable question library as a JSON blob in the
 * website_settings table under key "question_library".
 * No schema changes required.
 */

import { getSetting, setSetting } from "./settings.repository";
import { DEFAULT_LIBRARY_QUESTIONS } from "@/admin/data/question-library-defaults";
import type { QuestionType } from "@/types/database.types";

export type LibraryCategory =
  | "basic_info"
  | "lipedema"
  | "medical_history"
  | "nutrition"
  | "lifestyle";

export const LIBRARY_CATEGORIES: { value: LibraryCategory; labelEn: string; labelAr: string; color: string }[] = [
  { value: "basic_info",      labelEn: "Basic Information", labelAr: "المعلومات الأساسية", color: "blue" },
  { value: "lipedema",        labelEn: "Lipedema",          labelAr: "الليبيديما",          color: "rose" },
  { value: "medical_history", labelEn: "Medical History",   labelAr: "التاريخ الطبي",       color: "purple" },
  { value: "nutrition",       labelEn: "Nutrition",         labelAr: "التغذية",             color: "emerald" },
  { value: "lifestyle",       labelEn: "Lifestyle",         labelAr: "نمط الحياة",          color: "orange" },
];

export const CATEGORY_STYLES: Record<LibraryCategory, { bg: string; text: string; ring: string }> = {
  basic_info:      { bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-200" },
  lipedema:        { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  medical_history: { bg: "bg-purple-50",  text: "text-purple-700",  ring: "ring-purple-200" },
  nutrition:       { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  lifestyle:       { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200" },
};

export interface LibraryQuestion {
  id: string;
  category: LibraryCategory;
  type: QuestionType;
  label_en: string;
  label_ar: string;
  placeholder_en: string;
  placeholder_ar: string;
  help_en: string;
  help_ar: string;
  required: boolean;
  validation_note: string;
  options: { label_en: string; label_ar: string; value: string }[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

const SETTINGS_KEY = "question_library";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getLibraryQuestions(): Promise<LibraryQuestion[]> {
  const raw = await getSetting(SETTINGS_KEY);
  if (!raw) {
    // First time: seed with defaults and persist
    await setSetting(SETTINGS_KEY, DEFAULT_LIBRARY_QUESTIONS as unknown as import("@/types/database.types").Json);
    return DEFAULT_LIBRARY_QUESTIONS;
  }
  try {
    const parsed = raw as unknown as LibraryQuestion[];
    if (!Array.isArray(parsed)) return DEFAULT_LIBRARY_QUESTIONS;
    return parsed;
  } catch {
    return DEFAULT_LIBRARY_QUESTIONS;
  }
}

// ─── Write helpers ────────────────────────────────────────────────────────────

async function saveAll(questions: LibraryQuestion[]): Promise<boolean> {
  return setSetting(SETTINGS_KEY, questions as unknown as import("@/types/database.types").Json);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function addLibraryQuestion(
  question: Omit<LibraryQuestion, "id" | "createdAt" | "updatedAt">
): Promise<LibraryQuestion> {
  const all = await getLibraryQuestions();
  const now = new Date().toISOString();
  const newQ: LibraryQuestion = {
    ...question,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await saveAll([...all, newQ]);
  return newQ;
}

export async function updateLibraryQuestion(
  id: string,
  updates: Partial<Omit<LibraryQuestion, "id" | "createdAt">>
): Promise<boolean> {
  const all = await getLibraryQuestions();
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveAll(all);
}

export async function deleteLibraryQuestion(id: string): Promise<boolean> {
  const all = await getLibraryQuestions();
  const filtered = all.filter((q) => q.id !== id);
  return saveAll(filtered);
}

export async function duplicateLibraryQuestion(id: string): Promise<LibraryQuestion | null> {
  const all = await getLibraryQuestions();
  const original = all.find((q) => q.id === id);
  if (!original) return null;
  const now = new Date().toISOString();
  const copy: LibraryQuestion = {
    ...original,
    id: crypto.randomUUID(),
    label_en: `${original.label_en} (Copy)`,
    label_ar: original.label_ar ? `${original.label_ar} (نسخة)` : "",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  await saveAll([...all, copy]);
  return copy;
}

export async function saveQuestionToLibrary(
  question: Omit<LibraryQuestion, "id" | "createdAt" | "updatedAt" | "isDefault">
): Promise<LibraryQuestion> {
  return addLibraryQuestion({ ...question, isDefault: false });
}
