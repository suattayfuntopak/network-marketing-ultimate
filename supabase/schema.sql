-- ============================================================
-- Netmarvis NMOS — Supabase SQL Şeması
-- Tablo prefix: nmu_
--
-- KULLANIM: Supabase Dashboard → SQL Editor → Bu dosyayı yapıştır → Run
-- ============================================================

-- ─── UUID extension ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. KULLANICI PROFİLİ ────────────────────────────────────
-- Supabase auth.users tablosunu genişletir
CREATE TABLE IF NOT EXISTS nmu_user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'solo'
                  CHECK (role IN ('solo','member','leader','org_leader','admin')),
  timezone      TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  language      TEXT NOT NULL DEFAULT 'tr',
  rank          TEXT,
  join_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  streak        INTEGER NOT NULL DEFAULT 0,
  xp            INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  momentum_score INTEGER NOT NULL DEFAULT 0,
  settings      JSONB NOT NULL DEFAULT '{"theme":"dark","notifications":true,"reducedMotion":false,"dailyGoalReminders":true,"aiSuggestions":true}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. KİŞİLER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_contacts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  avatar_url            TEXT,
  email                 TEXT,
  phone                 TEXT,
  location              TEXT,
  timezone              TEXT,
  language              TEXT DEFAULT 'tr',
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  source                TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive','do_not_contact')),
  pipeline_stage        TEXT NOT NULL DEFAULT 'new',
  interest_type         TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (interest_type IN ('product','business','both','unknown')),
  temperature           TEXT NOT NULL DEFAULT 'cold'
                          CHECK (temperature IN ('cold','warm','hot','frozen')),
  temperature_score     INTEGER NOT NULL DEFAULT 0 CHECK (temperature_score BETWEEN 0 AND 100),
  relationship_strength INTEGER NOT NULL DEFAULT 0 CHECK (relationship_strength BETWEEN 0 AND 100),
  last_contact_date     DATE,
  next_follow_up_date   DATE,
  preferred_channel     TEXT NOT NULL DEFAULT 'whatsapp',
  referred_by           TEXT,
  birthday              DATE,
  profession            TEXT,
  nickname              TEXT,
  telegram_username     TEXT,
  instagram_username    TEXT,
  whatsapp_username     TEXT,
  interests             TEXT,
  pain_points           TEXT,
  relationship_type     TEXT,
  family_notes          TEXT,
  goals_notes           TEXT,
  objection_tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_contacts_user_idx ON nmu_contacts(user_id);
CREATE INDEX IF NOT EXISTS nmu_contacts_stage_idx ON nmu_contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS nmu_contacts_followup_idx ON nmu_contacts(next_follow_up_date);

-- ─── 3. GÖREVLER ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES nmu_contacts(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'custom'
                 CHECK (type IN ('follow_up','call','meeting','presentation','onboarding','training','custom')),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed','skipped','overdue')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','urgent')),
  due_date     DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_tasks_user_idx ON nmu_tasks(user_id);
CREATE INDEX IF NOT EXISTS nmu_tasks_due_idx ON nmu_tasks(due_date);
CREATE INDEX IF NOT EXISTS nmu_tasks_status_idx ON nmu_tasks(status);

-- ─── 4. ETKİLEŞİMLER ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_interactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id       UUID NOT NULL REFERENCES nmu_contacts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL
                     CHECK (type IN ('call','message','meeting','email','note','presentation','follow_up')),
  channel          TEXT NOT NULL DEFAULT 'whatsapp',
  content          TEXT NOT NULL,
  outcome          TEXT CHECK (outcome IN ('positive','neutral','negative','no_response')),
  next_action      TEXT,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_interactions_contact_idx ON nmu_interactions(contact_id);
CREATE INDEX IF NOT EXISTS nmu_interactions_user_idx ON nmu_interactions(user_id);

-- ─── 5. ETKİNLİKLER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'online_presentation',
  start_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ NOT NULL,
  location      TEXT,
  meeting_url   TEXT,
  max_attendees INTEGER,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','live','completed','cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. ETKİNLİK KATILIMCILARI ───────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_event_attendees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES nmu_events(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES nmu_contacts(id) ON DELETE CASCADE,
  contact_name    TEXT NOT NULL,
  rsvp_status     TEXT NOT NULL DEFAULT 'invited'
                    CHECK (rsvp_status IN ('invited','confirmed','attended','no_show','declined')),
  follow_up_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (follow_up_status IN ('pending','sent','converted','lost')),
  UNIQUE(event_id, contact_id)
);

-- ─── 7. BİLDİRİMLER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  action_url  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_notifications_user_idx ON nmu_notifications(user_id);
CREATE INDEX IF NOT EXISTS nmu_notifications_read_idx ON nmu_notifications(user_id, is_read);

-- ─── 8. KAMPANYALAR ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'launch',
  description TEXT NOT NULL DEFAULT '',
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','paused','completed')),
  metrics     JSONB NOT NULL DEFAULT '{"totalEnrolled":0,"totalCompleted":0,"conversionRate":0}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. ÜRÜNLER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  price_try     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  reorder_cycle_days INTEGER,
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_products_user_idx ON nmu_products(user_id);
CREATE INDEX IF NOT EXISTS nmu_products_active_idx ON nmu_products(user_id, is_active);

-- ─── 10. SİPARİŞLER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES nmu_contacts(id) ON DELETE CASCADE,
  items             JSONB NOT NULL DEFAULT '[]',
  total_try         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','delivered','cancelled')),
  note              TEXT,
  order_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  next_reorder_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_orders_user_idx    ON nmu_orders(user_id);
CREATE INDEX IF NOT EXISTS nmu_orders_contact_idx ON nmu_orders(contact_id);
CREATE INDEX IF NOT EXISTS nmu_orders_date_idx    ON nmu_orders(order_date);

-- ─── 11. AI RATE LIMIT BUCKETS ───────────────────────────────
CREATE TABLE IF NOT EXISTS nmu_ai_rate_limits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nmu_ai_rate_limits_user_created_idx
  ON nmu_ai_rate_limits(user_id, created_at DESC);

-- ─── UPDATED_AT OTOMATİK GÜNCELLEME ──────────────────────────
CREATE OR REPLACE FUNCTION nmu_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nmu_user_profiles','nmu_contacts','nmu_tasks',
    'nmu_events','nmu_campaigns','nmu_products','nmu_orders'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION nmu_set_updated_at();', t, t
    );
  END LOOP;
END $$;

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Her kullanıcı yalnızca kendi verilerini görebilir/düzenleyebilir

ALTER TABLE nmu_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_interactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmu_ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- nmu_user_profiles policies
CREATE POLICY "nmu_profile_own" ON nmu_user_profiles
  FOR ALL USING (auth.uid() = id);

-- nmu_contacts policies
CREATE POLICY "nmu_contacts_own" ON nmu_contacts
  FOR ALL USING (auth.uid() = user_id);

-- nmu_tasks policies
CREATE POLICY "nmu_tasks_own" ON nmu_tasks
  FOR ALL USING (auth.uid() = user_id);

-- nmu_interactions policies
CREATE POLICY "nmu_interactions_own" ON nmu_interactions
  FOR ALL USING (auth.uid() = user_id);

-- nmu_events policies
CREATE POLICY "nmu_events_own" ON nmu_events
  FOR ALL USING (auth.uid() = user_id);

-- nmu_event_attendees: etkinlik sahibi yönetebilir
CREATE POLICY "nmu_attendees_own" ON nmu_event_attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nmu_events
      WHERE nmu_events.id = nmu_event_attendees.event_id
        AND nmu_events.user_id = auth.uid()
    )
  );

-- nmu_notifications policies
CREATE POLICY "nmu_notifications_own" ON nmu_notifications
  FOR ALL USING (auth.uid() = user_id);

-- nmu_campaigns policies
CREATE POLICY "nmu_campaigns_own" ON nmu_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- nmu_products policies
CREATE POLICY "nmu_products_own" ON nmu_products
  FOR ALL USING (auth.uid() = user_id);

-- nmu_orders policies
CREATE POLICY "nmu_orders_own" ON nmu_orders
  FOR ALL USING (auth.uid() = user_id);

-- nmu_ai_rate_limits policies
DROP POLICY IF EXISTS "nmu_ai_rate_limits_own" ON nmu_ai_rate_limits;
CREATE POLICY "nmu_ai_rate_limits_own" ON nmu_ai_rate_limits
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── YENİ KULLANICI KAYIT TRIGGER'I ──────────────────────────
-- Supabase Auth'a kayıt olunca otomatik profil oluşturur
CREATE OR REPLACE FUNCTION nmu_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nmu_user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS nmu_on_auth_user_created ON auth.users;
CREATE TRIGGER nmu_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION nmu_handle_new_user();

-- ─── TAMAMLANDI ───────────────────────────────────────────────
-- Tablo listesi: nmu_user_profiles, nmu_contacts, nmu_tasks,
-- nmu_interactions, nmu_events, nmu_event_attendees,
-- nmu_notifications, nmu_campaigns, nmu_products, nmu_orders,
-- nmu_ai_rate_limits
