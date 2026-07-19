/**
 * src/lib/upload/index.ts
 * Barrel export for the unified upload system.
 */

export type { UploadOptions, UploadResult } from "./upload.types";
export {
  MEDIA_BUCKET,
  uploadToStorage,
  storagePathFromUrl,
  deleteFromStorage,
  safeName,
  buildPath,
} from "./upload.service";
export type { UploadFn, UseUploadReturn } from "./useUpload";
export { useUpload } from "./useUpload";
