/**
 * portal/repositories/progress.repository.ts
 * Read-only view of the client's own progress entries and photos.
 */

import { supabase } from "@/lib/supabase";
import type { ProgressEntryRow, ProgressPhotoRow } from "@/types/database.types";

export type { ProgressEntryRow, ProgressPhotoRow };

export interface ProgressEntryWithPhotos extends ProgressEntryRow {
  photos: ProgressPhotoRow[];
}

export async function getOwnProgressEntries(
  clientId: string,
): Promise<ProgressEntryWithPhotos[]> {
  const { data: entries, error } = await supabase
    .from("progress_entries")
    .select("*")
    .eq("client_id", clientId)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("[portal/progress] getOwnProgressEntries:", error.message);
    return [];
  }

  if (!entries || entries.length === 0) return [];

  const entryIds = entries.map((e) => e.id);
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .in("entry_id", entryIds);

  const photosByEntry = new Map<string, ProgressPhotoRow[]>();
  for (const photo of (photos ?? []) as ProgressPhotoRow[]) {
    const existing = photosByEntry.get(photo.entry_id) ?? [];
    existing.push(photo);
    photosByEntry.set(photo.entry_id, existing);
  }

  return (entries as ProgressEntryRow[]).map((entry) => ({
    ...entry,
    photos: photosByEntry.get(entry.id) ?? [],
  }));
}
