CREATE TABLE IF NOT EXISTS mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_messages_sender_type_check'
  ) THEN
    ALTER TABLE mail_messages
      ADD CONSTRAINT mail_messages_sender_type_check
      CHECK (sender_type IN ('student', 'company', 'admin', 'system'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mail_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_recipients_recipient_type_check'
  ) THEN
    ALTER TABLE mail_recipients
      ADD CONSTRAINT mail_recipients_recipient_type_check
      CHECK (recipient_type IN ('student', 'company', 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_recipients_unique_message_recipient'
  ) THEN
    ALTER TABLE mail_recipients
      ADD CONSTRAINT mail_recipients_unique_message_recipient
      UNIQUE (message_id, recipient_id, recipient_type);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_recipients_message_id_fk'
  ) THEN
    ALTER TABLE mail_recipients
      ADD CONSTRAINT mail_recipients_message_id_fk
      FOREIGN KEY (message_id) REFERENCES mail_messages (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mailbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'inbox',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  starred BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mailbox_items_owner_type_check'
  ) THEN
    ALTER TABLE mailbox_items
      ADD CONSTRAINT mailbox_items_owner_type_check
      CHECK (owner_type IN ('student', 'company', 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mailbox_items_folder_check'
  ) THEN
    ALTER TABLE mailbox_items
      ADD CONSTRAINT mailbox_items_folder_check
      CHECK (folder IN ('inbox', 'sent', 'drafts', 'trash'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mailbox_items_unique_owner_message_folder'
  ) THEN
    ALTER TABLE mailbox_items
      ADD CONSTRAINT mailbox_items_unique_owner_message_folder
      UNIQUE (message_id, owner_id, owner_type, folder);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mailbox_items_message_id_fk'
  ) THEN
    ALTER TABLE mailbox_items
      ADD CONSTRAINT mailbox_items_message_id_fk
      FOREIGN KEY (message_id) REFERENCES mail_messages (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mail_user_policies (
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  sending_locked BOOLEAN NOT NULL DEFAULT FALSE,
  lock_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, user_type)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_user_policies_user_type_check'
  ) THEN
    ALTER TABLE mail_user_policies
      ADD CONSTRAINT mail_user_policies_user_type_check
      CHECK (user_type IN ('student', 'company', 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mail_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  target_message_id UUID,
  target_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mail_audit_logs_actor_type_check'
  ) THEN
    ALTER TABLE mail_audit_logs
      ADD CONSTRAINT mail_audit_logs_actor_type_check
      CHECK (actor_type IN ('student', 'company', 'admin', 'system'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS mail_messages_sender_idx
  ON mail_messages (sender_id, sender_type);

CREATE INDEX IF NOT EXISTS mail_messages_sent_at_idx
  ON mail_messages (sent_at DESC);

CREATE INDEX IF NOT EXISTS mail_recipients_message_idx
  ON mail_recipients (message_id);

CREATE INDEX IF NOT EXISTS mail_recipients_recipient_idx
  ON mail_recipients (recipient_id, recipient_type);

CREATE INDEX IF NOT EXISTS mailbox_items_owner_folder_idx
  ON mailbox_items (owner_id, owner_type, folder);

CREATE INDEX IF NOT EXISTS mailbox_items_owner_read_idx
  ON mailbox_items (owner_id, owner_type, read);

CREATE INDEX IF NOT EXISTS mailbox_items_message_idx
  ON mailbox_items (message_id);

CREATE INDEX IF NOT EXISTS mail_audit_logs_created_idx
  ON mail_audit_logs (created_at DESC);
