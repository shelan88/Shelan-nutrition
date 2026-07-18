-- Add url column to uploaded_files so admins can store the public storage URL
-- when they upload a file, and clients can download it from the portal.

ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS url TEXT;
