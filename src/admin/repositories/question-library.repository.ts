/**
 * Question Library Repository — v2
 *
 * Two separate libraries:
 *   System Library  — read-only, sourced from DEFAULT_LIBRARY_QUESTIONS constant
 *   My Library      — admin-created/customised questions, persisted in website_settings
 *
 * Settings keys used:
 *   "my_library"          → LibraryQuestion[]  (source: "my")
 *   "my_library_folders"  → MyLibraryFolder[]
 *
 * Legacy: the old "question_library" key stored both defaults and admin questions
 * together. On first access of My Library, any non-default questions found there
 * are transparently migrated to "my_library" so nothing is lost.
 */

import { getSetting, setSetting } from "./settings.repository";
import { DEFAULT_LIBRARY_QUESTIONS } from "@/admin/data/question-library-defaults";
import type { QuestionType } from "@/types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LibrarySource = "system" | "my";

export type LibraryCategory =
  | "basic_info"
  | "lipedema"
  | "medical_history"
  | "nutrition"
  | "lifestyle";

export interface LibraryQuestion {
  id: string;
  source: LibrarySource;
  category: LibraryCategory;
  folderId?: string;               // My Library only — references a MyLibraryFolder.id
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

export interface MyLibraryFolder {
  id: string;
  name: string;     // English label
  nameAr: string;   // Arabic label
  sortOrder: number;
  createdAt: string;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

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

// IDs of the 44 built-in system questions — used to detect legacy orphans
const SYSTEM_QUESTION_IDS = new Set(DEFAULT_LIBRARY_QUESTIONS.map((q) => q.id));

const DEFAULT_FOLDERS: Omit<MyLibraryFolder, "createdAt">[] = [
  { id: "folder-basic-info",      name: "Basic Information", nameAr: "المعلومات الأساسية", sortOrder: 0 },
  { id: "folder-medical-history", name: "Medical History",   nameAr: "التاريخ الطبي",       sortOrder: 1 },
  { id: "folder-lipedema",        name: "Lipedema",          nameAr: "الليبيديما",          sortOrder: 2 },
  { id: "folder-nutrition",       name: "Nutrition",         nameAr: "التغذية",             sortOrder: 3 },
  { id: "folder-lifestyle",       name: "Lifestyle",         nameAr: "نمط الحياة",          sortOrder: 4 },
  { id: "folder-womens-health",   name: "Women's Health",    nameAr: "صحة المرأة",          sortOrder: 5 },
  { id: "folder-follow-up",       name: "Follow-up",         nameAr: "المتابعة",            sortOrder: 6 },
  { id: "folder-custom",          name: "Custom",            nameAr: "مخصص",               sortOrder: 7 },
];

const MY_LIBRARY_KEY      = "my_library";
const MY_LIBRARY_FOLDERS  = "my_library_folders";
const LEGACY_KEY          = "question_library";

// ─── System Library ───────────────────────────────────────────────────────────

/**
 * Returns the immutable system question set. Always derived from the defaults
 * constant — never reads from the database, never changes at runtime.
 */
export function getSystemLibraryQuestions(): LibraryQuestion[] {
  return DEFAULT_LIBRARY_QUESTIONS.map((q) => ({
    ...q,
    source: "system" as const,
  }));
}

// ─── My Library — internal I/O ────────────────────────────────────────────────

async function readMyLib(): Promise<LibraryQuestion[]> {
  const raw = await getSetting(MY_LIBRARY_KEY);
  if (raw === null || raw === undefined) return [];
  const parsed = raw as unknown as LibraryQuestion[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeMyLib(questions: LibraryQuestion[]): Promise<boolean> {
  return setSetting(MY_LIBRARY_KEY, questions as unknown as import("@/types/database.types").Json);
}

// ─── Legacy migration ─────────────────────────────────────────────────────────

/**
 * Run once: if the old "question_library" settings key contains questions
 * whose IDs are NOT in the system defaults set, they were admin-created and
 * must be moved to "my_library" so they are not lost.
 * After this runs, "my_library" always exists (even if empty).
 */
async function migrateOnce(): Promise<void> {
  const existing = await getSetting(MY_LIBRARY_KEY);
  if (existing !== null && existing !== undefined) return; // already migrated

  const legacyRaw = await getSetting(LEGACY_KEY);
  if (!legacyRaw) {
    await writeMyLib([]);
    return;
  }

  const legacy = legacyRaw as unknown as LibraryQuestion[];
  if (!Array.isArray(legacy)) { await writeMyLib([]); return; }

  const orphans = legacy.filter((q) => !SYSTEM_QUESTION_IDS.has(q.id));
  const migrated: LibraryQuestion[] = orphans.map((q) => ({
    ...q,
    source: "my" as const,
  }));
  await writeMyLib(migrated);
}

// ─── My Library — public CRUD ─────────────────────────────────────────────────

export async function getMyLibraryQuestions(): Promise<LibraryQuestion[]> {
  await migrateOnce();
  return readMyLib();
}

export async function addMyLibraryQuestion(
  question: Omit<LibraryQuestion, "id" | "source" | "createdAt" | "updatedAt">
): Promise<LibraryQuestion> {
  const all = await readMyLib();
  const now = new Date().toISOString();
  const newQ: LibraryQuestion = {
    ...question,
    id: crypto.randomUUID(),
    source: "my",
    createdAt: now,
    updatedAt: now,
  };
  await writeMyLib([...all, newQ]);
  return newQ;
}

export async function updateMyLibraryQuestion(
  id: string,
  updates: Partial<Omit<LibraryQuestion, "id" | "source" | "createdAt">>
): Promise<boolean> {
  const all = await readMyLib();
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  return writeMyLib(all);
}

export async function deleteMyLibraryQuestion(id: string): Promise<boolean> {
  const all = await readMyLib();
  return writeMyLib(all.filter((q) => q.id !== id));
}

export async function duplicateMyLibraryQuestion(id: string): Promise<LibraryQuestion | null> {
  const all = await readMyLib();
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
  await writeMyLib([...all, copy]);
  return copy;
}

/** Customize: deep-clone a System Library question into My Library. */
export async function customizeSystemQuestion(
  systemQ: LibraryQuestion,
  folderId?: string
): Promise<LibraryQuestion> {
  return addMyLibraryQuestion({
    category: systemQ.category,
    folderId,
    type: systemQ.type,
    label_en: systemQ.label_en,
    label_ar: systemQ.label_ar,
    placeholder_en: systemQ.placeholder_en,
    placeholder_ar: systemQ.placeholder_ar,
    help_en: systemQ.help_en,
    help_ar: systemQ.help_ar,
    required: systemQ.required,
    validation_note: systemQ.validation_note,
    options: systemQ.options.map((o) => ({ ...o })),
    isDefault: false,
  });
}

/** Move a My Library question to a different folder (or remove from any folder). */
export async function moveQuestionToFolder(
  questionId: string,
  folderId: string | undefined
): Promise<boolean> {
  return updateMyLibraryQuestion(questionId, { folderId });
}

/**
 * Save a question from the Assessment Builder to My Library (⭐ Save to My Library).
 * Accepts the same shape the Assessment Builder already builds.
 */
export async function saveQuestionToLibrary(
  question: Omit<LibraryQuestion, "id" | "source" | "createdAt" | "updatedAt" | "isDefault">,
  folderId?: string
): Promise<LibraryQuestion> {
  return addMyLibraryQuestion({ ...question, folderId, isDefault: false });
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function getMyLibraryFolders(): Promise<MyLibraryFolder[]> {
  const raw = await getSetting(MY_LIBRARY_FOLDERS);
  if (raw === null || raw === undefined) {
    const now = new Date().toISOString();
    const seeded: MyLibraryFolder[] = DEFAULT_FOLDERS.map((f) => ({ ...f, createdAt: now }));
    await setSetting(MY_LIBRARY_FOLDERS, seeded as unknown as import("@/types/database.types").Json);
    return seeded;
  }
  const parsed = raw as unknown as MyLibraryFolder[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeFolders(folders: MyLibraryFolder[]): Promise<boolean> {
  return setSetting(MY_LIBRARY_FOLDERS, folders as unknown as import("@/types/database.types").Json);
}

export async function addMyLibraryFolder(name: string, nameAr: string): Promise<MyLibraryFolder> {
  const folders = await getMyLibraryFolders();
  const now = new Date().toISOString();
  const f: MyLibraryFolder = {
    id: crypto.randomUUID(),
    name: name.trim(),
    nameAr: nameAr.trim(),
    sortOrder: folders.length,
    createdAt: now,
  };
  await writeFolders([...folders, f]);
  return f;
}

export async function updateMyLibraryFolder(
  id: string,
  updates: Partial<Pick<MyLibraryFolder, "name" | "nameAr" | "sortOrder">>
): Promise<boolean> {
  const folders = await getMyLibraryFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  folders[idx] = { ...folders[idx], ...updates };
  return writeFolders(folders);
}

export async function deleteMyLibraryFolder(id: string): Promise<boolean> {
  const [folders, questions] = await Promise.all([
    getMyLibraryFolders(),
    readMyLib(),
  ]);
  // Unassign questions from the deleted folder
  const newQuestions = questions.map((q) =>
    q.folderId === id ? { ...q, folderId: undefined } : q
  );
  await Promise.all([
    writeFolders(folders.filter((f) => f.id !== id)),
    writeMyLib(newQuestions),
  ]);
  return true;
}

// ─── Compat shim ──────────────────────────────────────────────────────────────

/**
 * Returns System + My Library questions combined.
 * Used by QuestionLibraryDrawer and any legacy caller that still uses this API.
 */
export async function getLibraryQuestions(): Promise<LibraryQuestion[]> {
  const [system, my] = await Promise.all([
    Promise.resolve(getSystemLibraryQuestions()),
    getMyLibraryQuestions(),
  ]);
  return [...system, ...my];
}

// Legacy aliases kept so existing imports don't break
export const addLibraryQuestion      = addMyLibraryQuestion;
export const updateLibraryQuestion   = updateMyLibraryQuestion;
export const deleteLibraryQuestion   = deleteMyLibraryQuestion;
export const duplicateLibraryQuestion = duplicateMyLibraryQuestion;
