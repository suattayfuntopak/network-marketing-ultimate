-- ============================================================
-- NMU — Extra contact profile / channel fields
-- Supabase Dashboard → SQL Editor → Run once on existing DB
-- ============================================================

ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS telegram_username text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS instagram_username text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS whatsapp_username text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS interests text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS pain_points text;
ALTER TABLE nmu_contacts ADD COLUMN IF NOT EXISTS relationship_type text;
