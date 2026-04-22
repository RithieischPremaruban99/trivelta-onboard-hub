-- Migration: Phase P4 database changes
-- Apply manually via Supabase dashboard SQL editor.

-- ─── 1. Activity log: add prospect_id support ─────────────────────────────
-- client_id is already nullable (no NOT NULL constraint in original migration).
ALTER TABLE client_activity_log
  ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activity_log_prospect
  ON client_activity_log(prospect_id);

-- ─── 2. Prospect conversion lookup index ──────────────────────────────────
-- converted_to_client_id and converted_at already exist from Lovable migration.
CREATE INDEX IF NOT EXISTS idx_prospects_converted
  ON prospects(converted_to_client_id)
  WHERE converted_to_client_id IS NOT NULL;
