-- ============================================================
-- NMU — Landing Waitlist (Pro/Team duyuru listesi)
-- Supabase Dashboard → SQL Editor → Çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS nmu_waitlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  email_norm  TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  source      TEXT NOT NULL DEFAULT 'landing-pricing',
  locale      TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email_norm, source)
);

CREATE INDEX IF NOT EXISTS nmu_waitlist_created_idx ON nmu_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS nmu_waitlist_email_norm_idx ON nmu_waitlist(email_norm);

ALTER TABLE nmu_waitlist ENABLE ROW LEVEL SECURITY;

-- Anonymous + authenticated kullanıcılar yalnızca INSERT yapabilir.
DROP POLICY IF EXISTS "nmu_waitlist_insert" ON nmu_waitlist;
CREATE POLICY "nmu_waitlist_insert" ON nmu_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) BETWEEN 4 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- Okuma yalnızca service-role (admin) için. anon/authenticated SELECT yapamaz.
DROP POLICY IF EXISTS "nmu_waitlist_no_select" ON nmu_waitlist;

GRANT INSERT ON TABLE nmu_waitlist TO anon, authenticated;
