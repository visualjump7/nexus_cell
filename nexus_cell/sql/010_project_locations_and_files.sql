-- ============================================================
-- NEXUS CELL — Project locations + file attachments
--
-- Adds optional latitude/longitude to projects so the UI can pin a project
-- to a map without parsing the free-text location.
--
-- Provisions a Storage bucket `project-files` for arbitrary attachments
-- (PDF, Excel, Word, images) with RLS that scopes access to org members.
-- File paths must follow `<organization_id>/<project_id>/<filename>`.
--
-- Run in Supabase SQL Editor.
-- ============================================================

-- ── Project lat/lng ──
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- ── Storage bucket for project files ──
-- Public bucket so download links work without signed-URL infrastructure.
-- RLS still gates uploads/deletes; reads are by URL once you have it.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  26214400, -- 25 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- xlsx
    'application/vnd.ms-excel',                                          -- xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- docx
    'application/msword',                                                -- doc
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Storage RLS policies ──
-- Path convention enforced by checking the leading <org_id> segment.
-- (storage.foldername returns an array of path segments.)

DROP POLICY IF EXISTS "project_files_select" ON storage.objects;
CREATE POLICY "project_files_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "project_files_insert" ON storage.objects;
CREATE POLICY "project_files_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );

DROP POLICY IF EXISTS "project_files_delete" ON storage.objects;
CREATE POLICY "project_files_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );
