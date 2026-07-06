-- Migration 005: Dynamic geo-fence regions configuration
-- Run: psql $DATABASE_URL -f migration/005_geofence_regions.sql

CREATE TABLE IF NOT EXISTS geofence_regions (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,          -- Display name e.g. "Punjab"
  slug        TEXT NOT NULL UNIQUE,   -- Slug matched against ip-api regionName (lowercase)
  country     TEXT NOT NULL DEFAULT 'India',
  lat_min     NUMERIC(9,6),
  lat_max     NUMERIC(9,6),
  lon_min     NUMERIC(9,6),
  lon_max     NUMERIC(9,6),
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  SMALLINT DEFAULT 99
);

-- Pre-populate with Indian states / UTs relevant for Punjab Newsline
INSERT INTO geofence_regions (name, slug, lat_min, lat_max, lon_min, lon_max, is_active, sort_order) VALUES
  ('Punjab',            'punjab',               29.50, 32.60, 73.80, 76.90, TRUE,  1),
  ('Chandigarh',        'chandigarh',            30.65, 30.80, 76.70, 76.90, TRUE,  2),
  ('Haryana',           'haryana',               27.60, 30.90, 74.50, 77.60, FALSE, 3),
  ('Himachal Pradesh',  'himachal pradesh',      30.40, 33.20, 75.60, 79.00, FALSE, 4),
  ('Jammu and Kashmir', 'jammu and kashmir',     32.30, 37.10, 73.70, 80.30, FALSE, 5),
  ('Delhi',             'delhi',                 28.40, 28.88, 76.84, 77.35, FALSE, 6),
  ('Rajasthan',         'rajasthan',             23.00, 30.20, 69.50, 78.30, FALSE, 7),
  ('Uttar Pradesh',     'uttar pradesh',         23.90, 30.40, 77.10, 84.60, FALSE, 8),
  ('Uttarakhand',       'uttarakhand',           29.00, 31.50, 77.60, 81.10, FALSE, 9),
  ('Madhya Pradesh',    'madhya pradesh',        21.10, 26.90, 74.00, 82.80, FALSE, 10),
  ('Maharashtra',       'maharashtra',           15.60, 22.10, 72.60, 80.90, FALSE, 11),
  ('Gujarat',           'gujarat',               20.10, 24.70, 68.20, 74.40, FALSE, 12),
  ('Karnataka',         'karnataka',             11.60, 18.40, 74.00, 78.60, FALSE, 13),
  ('Tamil Nadu',        'tamil nadu',             8.10, 13.60, 76.20, 80.40, FALSE, 14),
  ('West Bengal',       'west bengal',           21.50, 27.20, 85.80, 89.90, FALSE, 15),
  ('Bihar',             'bihar',                 24.30, 27.50, 83.30, 88.30, FALSE, 16),
  ('Telangana',         'telangana',             15.80, 19.90, 77.20, 81.80, FALSE, 17),
  ('Andhra Pradesh',    'andhra pradesh',        12.60, 19.90, 76.80, 84.80, FALSE, 18),
  ('Kerala',            'kerala',                 8.30, 12.80, 74.80, 77.40, FALSE, 19),
  ('Odisha',            'odisha',                17.80, 22.60, 81.40, 87.50, FALSE, 20),
  ('Assam',             'assam',                 24.10, 27.90, 89.70, 96.00, FALSE, 21),
  ('Jharkhand',         'jharkhand',             21.90, 25.30, 83.30, 87.90, FALSE, 22),
  ('Chhattisgarh',      'chhattisgarh',          17.80, 24.10, 80.20, 84.40, FALSE, 23),
  ('Goa',               'goa',                   14.90, 15.80, 73.70, 74.30, FALSE, 24),
  ('Manipur',           'manipur',               23.80, 25.70, 93.00, 94.80, FALSE, 25),
  ('Meghalaya',         'meghalaya',             25.00, 26.10, 89.80, 92.80, FALSE, 26),
  ('Tripura',           'tripura',               22.90, 24.50, 91.20, 92.30, FALSE, 27),
  ('Nagaland',          'nagaland',              25.20, 27.00, 93.30, 95.30, FALSE, 28),
  ('Arunachal Pradesh', 'arunachal pradesh',     26.70, 29.50, 91.60, 97.40, FALSE, 29),
  ('Mizoram',           'mizoram',               21.90, 24.50, 92.30, 93.40, FALSE, 30),
  ('Sikkim',            'sikkim',                27.10, 28.10, 88.00, 88.90, FALSE, 31),
  ('Ladakh',            'ladakh',                32.30, 36.00, 75.60, 80.00, FALSE, 32),
  ('Puducherry',        'puducherry',             9.80, 12.10, 76.70, 80.00, FALSE, 33),
  ('Andaman and Nicobar Islands', 'andaman and nicobar islands', 6.00, 13.70, 92.20, 93.90, FALSE, 34),
  ('Lakshadweep',       'lakshadweep',            8.00, 12.70, 71.80, 74.00, FALSE, 35)
ON CONFLICT (slug) DO NOTHING;
