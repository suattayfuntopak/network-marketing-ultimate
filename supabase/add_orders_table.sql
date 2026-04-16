-- ============================================================
-- NMU — Sipariş Takip Tablosu
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS nmu_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES nmu_contacts(id) ON DELETE CASCADE,
  -- Sipariş kalemleri JSONB olarak: [{ product_id, product_name, quantity, unit_price_try }]
  items           JSONB NOT NULL DEFAULT '[]',
  total_try       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','delivered','cancelled')),
  note            TEXT,
  order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  next_reorder_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_orders_user_idx    ON nmu_orders(user_id);
CREATE INDEX IF NOT EXISTS nmu_orders_contact_idx ON nmu_orders(contact_id);
CREATE INDEX IF NOT EXISTS nmu_orders_date_idx    ON nmu_orders(order_date);

-- Updated_at trigger
DO $$
BEGIN
  EXECUTE '
    DROP TRIGGER IF EXISTS set_updated_at ON nmu_orders;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON nmu_orders
    FOR EACH ROW EXECUTE FUNCTION nmu_set_updated_at();
  ';
END $$;

-- RLS
ALTER TABLE nmu_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nmu_orders_own" ON nmu_orders
  FOR ALL USING (auth.uid() = user_id);
