ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'private';

CREATE INDEX IF NOT EXISTS documents_access_level_idx ON documents (access_level);

CREATE TABLE IF NOT EXISTS document_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  access TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_access_unique_idx ON document_access (document_id, user_id, user_type);
CREATE INDEX IF NOT EXISTS document_access_user_idx ON document_access (user_id, user_type);

CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  access TEXT NOT NULL DEFAULT 'view',
  created_by UUID,
  created_by_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS document_shares_document_idx ON document_shares (document_id);

CREATE TABLE IF NOT EXISTS document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID,
  requester_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS document_requests_target_idx ON document_requests (target_id, target_type);
CREATE INDEX IF NOT EXISTS document_requests_requester_idx ON document_requests (requester_id, requester_type);
