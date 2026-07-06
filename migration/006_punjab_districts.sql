-- Migration 006: Punjab districts as sub-regions
-- Run: psql $DATABASE_URL -f migration/006_punjab_districts.sql

-- Add parent_id to support region hierarchy (state → district)
ALTER TABLE geofence_regions
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES geofence_regions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS region_type TEXT NOT NULL DEFAULT 'state'; -- 'state', 'ut', 'district'

-- Update existing rows to type 'state' or 'ut'
UPDATE geofence_regions SET region_type = 'ut'
WHERE slug IN ('chandigarh', 'delhi', 'puducherry', 'lakshadweep', 'andaman and nicobar islands', 'ladakh');

UPDATE geofence_regions SET region_type = 'state'
WHERE region_type = 'state'; -- already set by default

-- Get Punjab's id and insert 23 districts under it
DO $$
DECLARE
  punjab_id INTEGER;
BEGIN
  SELECT id INTO punjab_id FROM geofence_regions WHERE slug = 'punjab';

  IF punjab_id IS NULL THEN
    RAISE EXCEPTION 'Punjab not found in geofence_regions. Run 005_geofence_regions.sql first.';
  END IF;

  INSERT INTO geofence_regions
    (name, slug, country, lat_min, lat_max, lon_min, lon_max, is_active, sort_order, parent_id, region_type)
  VALUES
    ('Amritsar',                   'amritsar',                   'India', 31.50, 31.90, 74.70, 75.30, TRUE,  1, punjab_id, 'district'),
    ('Barnala',                    'barnala',                    'India', 30.20, 30.55, 75.40, 75.80, TRUE,  2, punjab_id, 'district'),
    ('Bathinda',                   'bathinda',                   'India', 29.80, 30.30, 74.60, 75.50, TRUE,  3, punjab_id, 'district'),
    ('Faridkot',                   'faridkot',                   'India', 30.40, 30.80, 74.50, 74.90, TRUE,  4, punjab_id, 'district'),
    ('Fatehgarh Sahib',            'fatehgarh sahib',            'India', 30.40, 30.80, 76.20, 76.60, TRUE,  5, punjab_id, 'district'),
    ('Fazilka',                    'fazilka',                    'India', 29.90, 30.40, 73.90, 74.50, TRUE,  6, punjab_id, 'district'),
    ('Ferozepur',                  'ferozepur',                  'India', 30.50, 31.10, 74.40, 74.80, TRUE,  7, punjab_id, 'district'),
    ('Gurdaspur',                  'gurdaspur',                  'India', 31.80, 32.60, 75.10, 75.80, TRUE,  8, punjab_id, 'district'),
    ('Hoshiarpur',                 'hoshiarpur',                 'India', 31.30, 31.90, 75.50, 76.50, TRUE,  9, punjab_id, 'district'),
    ('Jalandhar',                  'jalandhar',                  'India', 31.10, 31.60, 75.30, 75.90, TRUE,  10, punjab_id, 'district'),
    ('Kapurthala',                 'kapurthala',                 'India', 31.10, 31.60, 75.00, 75.50, TRUE,  11, punjab_id, 'district'),
    ('Ludhiana',                   'ludhiana',                   'India', 30.60, 31.20, 75.50, 76.30, TRUE,  12, punjab_id, 'district'),
    ('Malerkotla',                 'malerkotla',                 'India', 30.30, 30.60, 75.60, 76.00, TRUE,  13, punjab_id, 'district'),
    ('Mansa',                      'mansa',                      'India', 29.80, 30.30, 75.10, 75.60, TRUE,  14, punjab_id, 'district'),
    ('Moga',                       'moga',                       'India', 30.50, 31.00, 74.90, 75.30, TRUE,  15, punjab_id, 'district'),
    ('Mohali (SAS Nagar)',         'mohali',                     'India', 30.50, 31.00, 76.50, 76.90, TRUE,  16, punjab_id, 'district'),
    ('Sri Muktsar Sahib',          'muktsar',                    'India', 29.90, 30.50, 74.30, 74.80, TRUE,  17, punjab_id, 'district'),
    ('Shaheed Bhagat Singh Nagar', 'nawanshahr',                 'India', 31.00, 31.60, 76.00, 76.60, TRUE,  18, punjab_id, 'district'),
    ('Pathankot',                  'pathankot',                  'India', 32.00, 32.60, 75.40, 76.00, TRUE,  19, punjab_id, 'district'),
    ('Patiala',                    'patiala',                    'India', 30.00, 30.70, 76.10, 76.90, TRUE,  20, punjab_id, 'district'),
    ('Rupnagar (Ropar)',           'rupnagar',                   'India', 30.70, 31.40, 76.40, 76.90, TRUE,  21, punjab_id, 'district'),
    ('Sangrur',                    'sangrur',                    'India', 29.90, 30.50, 75.50, 76.20, TRUE,  22, punjab_id, 'district'),
    ('Tarn Taran',                 'tarn taran',                 'India', 31.20, 31.70, 74.60, 75.10, TRUE,  23, punjab_id, 'district')
  ON CONFLICT (slug) DO NOTHING;

END $$;

CREATE INDEX IF NOT EXISTS idx_geofence_parent ON geofence_regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_geofence_type   ON geofence_regions(region_type);
