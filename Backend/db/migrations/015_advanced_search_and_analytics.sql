-- ============================================================
-- Migration 015: Advanced Search & Company Analytics
-- Adds: offer_views table, saved_searches table,
--       and search performance indexes on offers
-- ============================================================

-- GIN trigram index on offers.title for fast text search
CREATE INDEX IF NOT EXISTS offers_title_trgm_idx ON offers USING GIN (title gin_trgm_ops);

-- B-tree indexes for filter/sort performance
CREATE INDEX IF NOT EXISTS offers_type_idx ON offers (type);
CREATE INDEX IF NOT EXISTS offers_created_at_idx ON offers (created_at DESC NULLS LAST);

-- Track individual views of offers (for analytics)
CREATE TABLE IF NOT EXISTS offer_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  viewer_id UUID,
  viewer_type TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS offer_views_offer_id_idx ON offer_views (offer_id);
CREATE INDEX IF NOT EXISTS offer_views_viewed_at_idx ON offer_views (viewed_at);
CREATE INDEX IF NOT EXISTS offer_views_viewer_idx ON offer_views (viewer_id) WHERE viewer_id IS NOT NULL;

-- Saved searches per user (supports offer filtering + optional notify flag)
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches (user_id, user_type);
