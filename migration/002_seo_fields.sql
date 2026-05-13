-- Migration 002: Extra SEO fields for admin panel
-- Run after 001_schema.sql

ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS og_title       TEXT;
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS og_image       TEXT;
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS no_index       BOOLEAN DEFAULT FALSE;
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS focus_keyword  TEXT;
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS schema_type    TEXT DEFAULT 'NewsArticle';
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS canonical_url  TEXT;
ALTER TABLE ox_article ADD COLUMN IF NOT EXISTS author_id      INTEGER;

ALTER TABLE ox_video   ADD COLUMN IF NOT EXISTS no_index       BOOLEAN DEFAULT FALSE;
ALTER TABLE ox_gallery ADD COLUMN IF NOT EXISTS no_index       BOOLEAN DEFAULT FALSE;

-- SEO fields for categories
ALTER TABLE ox_code ADD COLUMN IF NOT EXISTS seo_title   TEXT;
ALTER TABLE ox_code ADD COLUMN IF NOT EXISTS seo_desc    TEXT;
ALTER TABLE ox_code ADD COLUMN IF NOT EXISTS seo_image   TEXT;
ALTER TABLE ox_code ADD COLUMN IF NOT EXISTS seo_h1      TEXT;
ALTER TABLE ox_code ADD COLUMN IF NOT EXISTS seo_intro   TEXT;
