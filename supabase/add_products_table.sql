-- ============================================================
-- NMU — Ürün Kataloğu Tablosu
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS nmu_products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  price_try     NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- Türk Lirası
  tags          TEXT[] NOT NULL DEFAULT '{}',
  reorder_cycle_days INTEGER,
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_products_user_idx ON nmu_products(user_id);
CREATE INDEX IF NOT EXISTS nmu_products_active_idx ON nmu_products(user_id, is_active);

-- Updated_at trigger
DO $$
BEGIN
  EXECUTE '
    DROP TRIGGER IF EXISTS set_updated_at ON nmu_products;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON nmu_products
    FOR EACH ROW EXECUTE FUNCTION nmu_set_updated_at();
  ';
END $$;

-- RLS
ALTER TABLE nmu_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nmu_products_own" ON nmu_products
  FOR ALL USING (auth.uid() = user_id);
