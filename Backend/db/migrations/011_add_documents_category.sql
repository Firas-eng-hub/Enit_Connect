-- Add an explicit category field for admin filtering and display.
-- Safe to run multiple times.
ALTER TABLE IF EXISTS documents
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS documents_category_idx ON documents (category);

