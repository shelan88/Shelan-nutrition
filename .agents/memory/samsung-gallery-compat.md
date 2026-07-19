---
name: Samsung Gallery Android upload compatibility
description: Five bugs in upload.service.ts that cause uploads from Samsung Gallery to fail while Google Photos succeeds.
---

## Root causes (all fixed)

### Bug 1 — CRITICAL: HEIC misidentified as video/mp4
Samsung phones produce HEIC/HEIF files. These use ISO Base Media File Format with an `ftyp` box at offset 4-7 (same structure as MP4/MOV). The old `sniffMimeType` detected the `ftyp` box and returned `"video/mp4"` for any non-QuickTime brand — including HEIC brands (`heic`, `heis`, `mif1`, `msf1`).

**Impact**: `allowedTypes: ["image/*"]` check ran `mimeMatches("video/mp4", "image/*")` → false → upload rejected with "File type not allowed". Affected `uploadAvatar` and `uploadEntryPhoto` (both pass `allowedTypes: ["image/*"]`).

**Fix**: Check brand bytes 8–11 before falling through to `"video/mp4"`. Brands `heic`, `heis`, `mif1`, `msf1` → `"image/heic"`. Brands `heif`, `MiHE`, `miaf` → `"image/heif"`. Brands `avif`, `avis` → `"image/avif"`.

### Bug 2: `compressImage` silently fails for HEIC
`<img>.src = blob:` cannot decode HEIC in Chrome/Android. Old code had `img.onerror → resolve(file)` which silently uploaded an unrenderable HEIC file.

**Fix**: HEIC/HEIF/AVIF go through `createImageBitmap()` (Chrome 64+ supports it). If that fails (old WebView), throw a human-readable error. Standard JPEG/PNG path keeps `<img>` + blob: URL but falls back to `createImageBitmap` on `img.onerror` (Samsung Internet Browser compat).

### Bug 3: `image/jpg` non-standard MIME (Samsung Gallery)
Samsung Gallery sometimes reports `"image/jpg"` instead of the standard `"image/jpeg"`. Sent verbatim as `contentType` to Supabase.

**Fix**: `normaliseMime()` function maps `"image/jpg"` → `"image/jpeg"`. Applied to resolved type before validation and before the storage upload call.

### Bug 4: Zero-byte file guard
Android content URIs can deliver a `File` with `size === 0` before the bytes are available (late resolution). No previous check caught this.

**Fix**: Added `file.size === 0` guard in `validateFile` with a clear message: "File appears to be empty. Please try again…"

### Bug 5: Avatar path extension mismatch after HEIC→JPEG conversion
`uploadAvatar` built path as `avatars/{id}/avatar.{original_ext}`. After HEIC→JPEG conversion the stored path would be `avatar.heic` but content is JPEG.

**Fix**: `profile.repository.ts` maps `heic`/`heif` extension to `jpg` before building the path.

## How to apply
Any future upload surface that accepts images must:
- Pass `allowedTypes: ["image/*"]` (safe — HEIC is now correctly sniffed as `image/heic`)
- Set `compress: true` if resizing is desired (HEIC is now handled via `createImageBitmap`)
- Include `.heic,.heif` in the `accept` prop alongside `.jpg,.jpeg,.png` for best Samsung Gallery UX
