CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  confirmation_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  type TEXT NOT NULL,
  work_at TEXT,
  class TEXT,
  promotion TEXT,
  linkedin TEXT,
  picture TEXT,
  aboutme TEXT,
  latitude TEXT,
  longitude TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS students_email_idx ON students (email);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'Active',
  confirmation_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  website TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT NOT NULL,
  about TEXT,
  logo TEXT,
  latitude TEXT,
  longitude TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS companies_email_idx ON companies (email);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  content TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ,
  docs JSONB NOT NULL DEFAULT '[]'::jsonb,
  candidacies_raw JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS offers_company_id_idx ON offers (company_id);

CREATE TABLE IF NOT EXISTS offer_candidacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL,
  source_key TEXT UNIQUE NOT NULL,
  source_index INTEGER,
  student_id UUID,
  body TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS offer_candidacies_offer_id_idx ON offer_candidacies (offer_id);
CREATE INDEX IF NOT EXISTS offer_candidacies_student_id_idx ON offer_candidacies (student_id);

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  picture TEXT,
  docs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  audience TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS news_status_idx ON news (status);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMPTZ,
  read BOOLEAN,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS messages_email_idx ON messages (email);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID,
  creator_name TEXT NOT NULL,
  creator_type TEXT,
  date TIMESTAMPTZ,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  type TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'private',
  link TEXT,
  thumbnail_url TEXT,
  emplacement TEXT NOT NULL,
  extension TEXT,
  mime_type TEXT,
  size TEXT,
  size_bytes BIGINT,
  version INTEGER NOT NULL DEFAULT 1,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  last_opened_at TIMESTAMPTZ,
  scan_status TEXT NOT NULL DEFAULT 'clean',
  scan_checked_at TIMESTAMPTZ,
  scan_error TEXT,
  quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS documents_creator_id_idx ON documents (creator_id);
CREATE INDEX IF NOT EXISTS documents_access_level_idx ON documents (access_level);
CREATE INDEX IF NOT EXISTS documents_scan_status_idx ON documents (scan_status);

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

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID,
  actor_id UUID,
  actor_type TEXT,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_audit_logs_document_idx ON document_audit_logs (document_id);
CREATE INDEX IF NOT EXISTS document_audit_logs_actor_idx ON document_audit_logs (actor_id, actor_type);
CREATE INDEX IF NOT EXISTS document_audit_logs_action_idx ON document_audit_logs (action);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  body TEXT NOT NULL,
  date TIMESTAMPTZ,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID,
  recipient_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications (recipient_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_type_idx ON notifications (recipient_type);

CREATE OR REPLACE FUNCTION enforce_notification_limit()
RETURNS trigger AS $$
BEGIN
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM notifications
    WHERE recipient_id = NEW.recipient_id
      AND recipient_type = NEW.recipient_type
    ORDER BY created_at DESC NULLS LAST
    OFFSET 30
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_limit_trigger ON notifications;

CREATE TRIGGER notifications_limit_trigger
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION enforce_notification_limit();

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID,
  user_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offer_candidacies_offer_id_fk'
  ) THEN
    ALTER TABLE offer_candidacies
      ADD CONSTRAINT offer_candidacies_offer_id_fk
      FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offers_company_id_fk'
  ) THEN
    ALTER TABLE offers
      ADD CONSTRAINT offers_company_id_fk
      FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offer_candidacies_student_id_fk'
  ) THEN
    ALTER TABLE offer_candidacies
      ADD CONSTRAINT offer_candidacies_student_id_fk
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE SET NULL;
  END IF;
END $$;
