-- ============================================================
-- NMU — AI Rate Limit Buckets (Shared Store)
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS nmu_ai_rate_limits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_ai_rate_limits_user_created_idx
  ON nmu_ai_rate_limits(user_id, created_at DESC);

ALTER TABLE nmu_ai_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmu_ai_rate_limits_own" ON nmu_ai_rate_limits;
CREATE POLICY "nmu_ai_rate_limits_own" ON nmu_ai_rate_limits
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
