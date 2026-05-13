-- Migration 003: SEO admin panel tables

-- Redirect manager
CREATE TABLE IF NOT EXISTS seo_redirects (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL UNIQUE,
  destination TEXT NOT NULL,
  type        SMALLINT DEFAULT 301,
  active      BOOLEAN DEFAULT TRUE,
  hits        INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_redirect_source ON seo_redirects(source) WHERE active = TRUE;

-- 404 error log
CREATE TABLE IF NOT EXISTS error_log_404 (
  id          SERIAL PRIMARY KEY,
  path        TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  hits        INTEGER DEFAULT 1,
  first_seen  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  resolved    BOOLEAN DEFAULT FALSE,
  redirect_to TEXT
);
CREATE INDEX IF NOT EXISTS idx_404_path ON error_log_404(path) WHERE resolved = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_404_path_unique ON error_log_404(path);

-- Sitemap overrides
CREATE TABLE IF NOT EXISTS sitemap_overrides (
  id            SERIAL PRIMARY KEY,
  url           TEXT NOT NULL UNIQUE,
  change_freq   TEXT DEFAULT 'monthly',
  priority      NUMERIC(2,1) DEFAULT 0.5,
  exclude       BOOLEAN DEFAULT FALSE,
  last_modified TIMESTAMPTZ,
  notes         TEXT
);

-- Schema.org templates
CREATE TABLE IF NOT EXISTS schema_templates (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL UNIQUE,
  template    JSONB NOT NULL,
  active      BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword tracker
CREATE TABLE IF NOT EXISTS seo_keywords (
  id          SERIAL PRIMARY KEY,
  keyword     TEXT NOT NULL,
  target_url  TEXT,
  priority    SMALLINT DEFAULT 3,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyword_rankings (
  id          SERIAL PRIMARY KEY,
  keyword_id  INTEGER REFERENCES seo_keywords(id) ON DELETE CASCADE,
  position    SMALLINT,
  impressions INTEGER,
  clicks      INTEGER,
  ctr         NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article translation links (for hreflang)
CREATE TABLE IF NOT EXISTS article_translations (
  id           SERIAL PRIMARY KEY,
  article_code INTEGER REFERENCES ox_article(article_code),
  related_code INTEGER REFERENCES ox_article(article_code),
  lang_code    SMALLINT,
  UNIQUE(article_code, related_code)
);

-- Author profiles (E-E-A-T)
CREATE TABLE IF NOT EXISTS authors (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE,
  bio       TEXT,
  photo     TEXT,
  email     TEXT,
  twitter   TEXT,
  facebook  TEXT,
  linkedin  TEXT,
  beats     TEXT,
  active    BOOLEAN DEFAULT TRUE
);

-- Site-wide settings (DB-backed, no redeploy needed)
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('robots_txt',         'User-agent: *'||chr(10)||'Allow: /'||chr(10)||'Sitemap: https://punjabnewsline.com/sitemap.xml'),
  ('og_default_image',   ''),
  ('og_site_name',       'Punjab Newsline'),
  ('twitter_handle',     '@punjabnewsline'),
  ('fb_app_id',          ''),
  ('gtm_id',             ''),
  ('ga_id',              ''),
  ('gsc_site_url',       'sc-domain:punjabnewsline.com'),
  ('gsc_oauth_token',    '')
ON CONFLICT (key) DO NOTHING;
