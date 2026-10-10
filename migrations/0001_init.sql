-- The catalogue, adopted on 2026-10-10 from the live D1 database.
-- Idempotent on purpose: applying it against the live database is a no-op,
-- and a fresh local database (wrangler dev) gets the full schema.

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER,
  sku TEXT PRIMARY KEY,
  slug TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  sale_price REAL,
  sale_starts_at TEXT,
  sale_ends_at TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  status TEXT,
  image_url TEXT,
  images TEXT,
  options TEXT,
  keywords TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
