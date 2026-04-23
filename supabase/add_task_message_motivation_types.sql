-- ============================================================
-- NMU — Extend task types with message + motivation
-- Supabase Dashboard → SQL Editor → Run once on existing DB
-- ============================================================

ALTER TABLE nmu_tasks
  DROP CONSTRAINT IF EXISTS nmu_tasks_type_check;

ALTER TABLE nmu_tasks
  ADD CONSTRAINT nmu_tasks_type_check
  CHECK (type IN ('follow_up','call','message','meeting','presentation','onboarding','training','motivation','custom'));
