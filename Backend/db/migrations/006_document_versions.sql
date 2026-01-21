ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  version INTEGER NOT NULL,
  link TEXT NOT NULL,
  extension TEXT,
  mime_type TEXT,
  size TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS document_versions_document_idx ON document_versions (document_id);
