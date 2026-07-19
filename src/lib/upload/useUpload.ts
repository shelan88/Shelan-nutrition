/**
 * useUpload.ts — SHELAN unified upload hook
 *
 * Wraps any async upload function with loading, progress, error and retry state.
 * Drives a simulated progress bar (0 → 90% during flight, 100% on completion).
 *
 * Usage:
 *   const { run, uploading, progress, error, retry } = useUpload();
 *   const url = await run(file, (f) => myUploadFn(f));
 */

import { useCallback, useRef, useState } from "react";

/** Signature of the domain upload function the caller provides. */
export type UploadFn = (file: File) => Promise<string | null>;

export interface UseUploadReturn {
  /** Start an upload. Returns the public URL or null on failure. */
  run: (file: File, fn: UploadFn) => Promise<string | null>;
  uploading: boolean;
  /** Simulated 0–100 percentage; 0 when idle. */
  progress: number;
  /** Error message from the most recent failure; null when none. */
  error: string | null;
  /** Replays the last upload with the same file and upload function. */
  retry: () => Promise<string | null>;
  /** Resets state without running another upload. */
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const lastFile = useRef<File | null>(null);
  const lastFn   = useRef<UploadFn | null>(null);

  const run = useCallback(async (file: File, fn: UploadFn): Promise<string | null> => {
    lastFile.current = file;
    lastFn.current   = fn;

    setUploading(true);
    setProgress(0);
    setError(null);

    // Simulated progress 0 → 90%
    let pct = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const inc = pct < 30 ? 7 : pct < 60 ? 4 : pct < 80 ? 2 : 0.6;
      pct = Math.min(90, pct + inc);
      setProgress(Math.round(pct));
      if (pct < 90) setTimeout(tick, 120);
    };
    setTimeout(tick, 60);

    try {
      console.log("[useUpload] calling upload fn for:", file.name, file.size, "bytes");
      const url = await fn(file);
      stopped = true;
      console.log("[useUpload] upload fn returned:", url);

      if (!url) {
        console.error("[useUpload] upload fn returned null — showing generic error");
        setProgress(0);
        setError("Upload failed — please try again.");
        setUploading(false);
        return null;
      }

      setProgress(100);
      // Brief pause at 100% so the bar is visibly complete before hiding
      setTimeout(() => { setUploading(false); setProgress(0); }, 500);
      return url;
    } catch (err) {
      stopped = true;
      const msg = err instanceof Error ? err.message : "Upload failed";
      console.error("[useUpload] upload fn THREW:", msg, err);
      setProgress(0);
      setError(msg);
      setUploading(false);
      return null;
    }
  }, []);

  const retry = useCallback((): Promise<string | null> => {
    if (!lastFile.current || !lastFn.current) return Promise.resolve(null);
    return run(lastFile.current, lastFn.current);
  }, [run]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { run, uploading, progress, error, retry, reset };
}
