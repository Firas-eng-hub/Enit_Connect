-- 017: indexes and derived columns so hot paths stay bounded on large tables.
--
-- NOTE: the migrator runs each file in a transaction, so these are plain
-- CREATE INDEX (they lock writes while building). That is fine while tables are
-- small; on a large production table, add future indexes with CONCURRENTLY in a
-- migration that runs outside a transaction.

-- ---------------------------------------------------------------------------
-- Students: city-level coordinates for the network map.
-- latitude/longitude are free TEXT geocoded from the home address. These
-- generated columns snap them to 1 decimal (~11 km) and turn malformed or
-- out-of-range text into NULL instead of failing writes. The nested CASE keeps
-- the numeric cast behind the regex check.
-- ---------------------------------------------------------------------------
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS lat_city DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN latitude ~ '^\s*-?[0-9]{1,3}(\.[0-9]+)?\s*$' THEN
      CASE WHEN abs(btrim(latitude)::numeric) <= 90
        THEN round(btrim(latitude)::numeric, 1)::double precision END
    END
  ) STORED;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS lng_city DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN longitude ~ '^\s*-?[0-9]{1,3}(\.[0-9]+)?\s*$' THEN
      CASE WHEN abs(btrim(longitude)::numeric) <= 180
        THEN round(btrim(longitude)::numeric, 1)::double precision END
    END
  ) STORED;

-- Map cells: GROUP BY / bbox over active, located students only.
CREATE INDEX IF NOT EXISTS students_map_cell_idx
  ON students (lat_city, lng_city)
  WHERE status = 'Active' AND lat_city IS NOT NULL AND lng_city IS NOT NULL;

-- Map people list: keyset pagination by name.
CREATE INDEX IF NOT EXISTS students_map_name_idx
  ON students (lower(lastname), lower(firstname), id)
  WHERE status = 'Active' AND lat_city IS NOT NULL AND lng_city IS NOT NULL;

-- Fuzzy full-name search (pg_trgm % / similarity / ILIKE).
CREATE INDEX IF NOT EXISTS students_fullname_trgm_idx
  ON students USING GIN ((coalesce(firstname, '') || ' ' || coalesce(lastname, '')) gin_trgm_ops);

-- Paged "newest first" listings.
CREATE INDEX IF NOT EXISTS students_created_at_idx ON students (created_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS companies_created_at_idx ON companies (created_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- Notifications: per-recipient "newest 30" pruning and listing.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON notifications (recipient_type, recipient_id, created_at DESC NULLS LAST);
DROP INDEX IF EXISTS notifications_recipient_type_idx;

-- Bulk broadcasts insert many rows at once and prune in one set-based DELETE;
-- they set app.bulk_notify for the transaction so the per-row trigger skips.
CREATE OR REPLACE FUNCTION enforce_notification_limit()
RETURNS trigger AS $$
BEGIN
  IF current_setting('app.bulk_notify', true) = 'on' THEN
    RETURN NEW;
  END IF;
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
