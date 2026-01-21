ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'clean',
  ADD COLUMN IF NOT EXISTS scan_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scan_error TEXT,
  ADD COLUMN IF NOT EXISTS quarantined BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID,
  actor_id UUID,
  actor_type TEXT,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_audit_logs_document_idx
  ON document_audit_logs (document_id);
CREATE INDEX IF NOT EXISTS document_audit_logs_actor_idx
  ON document_audit_logs (actor_id, actor_type);
CREATE INDEX IF NOT EXISTS document_audit_logs_action_idx
  ON document_audit_logs (action);
