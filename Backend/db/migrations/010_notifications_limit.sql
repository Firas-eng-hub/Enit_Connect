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
