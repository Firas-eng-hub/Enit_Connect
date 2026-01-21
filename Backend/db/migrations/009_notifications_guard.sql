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

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications (recipient_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_type_idx ON notifications (recipient_type);
