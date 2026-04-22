-- ============================================================
-- NMU — Müşteri Registry Tablosu (contacts'tan ayrık takip)
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS nmu_customers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id         UUID NOT NULL REFERENCES nmu_contacts(id) ON DELETE CASCADE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  became_customer_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_customer_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS nmu_customers_user_idx ON nmu_customers(user_id);
CREATE INDEX IF NOT EXISTS nmu_customers_active_idx ON nmu_customers(user_id, is_active);
CREATE INDEX IF NOT EXISTS nmu_customers_contact_idx ON nmu_customers(contact_id);

DO $$
BEGIN
  EXECUTE '
    DROP TRIGGER IF EXISTS set_updated_at ON nmu_customers;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON nmu_customers
    FOR EACH ROW EXECUTE FUNCTION nmu_set_updated_at();
  ';
END $$;

ALTER TABLE nmu_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmu_customers_own" ON nmu_customers;
CREATE POLICY "nmu_customers_own" ON nmu_customers
  FOR ALL USING (auth.uid() = user_id);

-- Mevcut became_customer kayıtlarını tabloya seed et.
INSERT INTO nmu_customers (user_id, contact_id, is_active, became_customer_at)
SELECT c.user_id, c.id, TRUE, COALESCE(c.updated_at, c.created_at, NOW())
FROM nmu_contacts c
WHERE c.pipeline_stage = 'became_customer'
ON CONFLICT (user_id, contact_id) DO UPDATE
SET is_active = EXCLUDED.is_active,
    left_customer_at = NULL;
