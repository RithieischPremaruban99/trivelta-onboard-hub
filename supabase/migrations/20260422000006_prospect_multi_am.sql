-- Migration: Multi-AM support for prospects via junction table
-- Apply manually via Supabase dashboard SQL editor.

-- ─── 1. Junction table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_account_managers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  am_email    text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (prospect_id, am_email)
);

CREATE INDEX IF NOT EXISTS idx_prospect_ams_prospect ON prospect_account_managers(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ams_email    ON prospect_account_managers(am_email);

ALTER TABLE prospect_account_managers ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS policies ──────────────────────────────────────────────────────

-- Admins and AEs: full access
CREATE POLICY "Admins see all prospect AMs" ON prospect_account_managers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'account_executive')
    )
  );

-- AMs: can see rows where they are the assigned AM
CREATE POLICY "AMs see their own prospect assignments" ON prospect_account_managers
  FOR SELECT USING (
    am_email = public.current_user_email()
  );

-- AMs: can insert assignments when creating prospects
CREATE POLICY "AMs can insert prospect AM assignments" ON prospect_account_managers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'account_manager'
    )
  );

-- ─── 3. Backfill existing single-AM assignments ───────────────────────────
INSERT INTO prospect_account_managers (prospect_id, am_email)
SELECT id, assigned_account_manager
FROM   prospects
WHERE  assigned_account_manager IS NOT NULL
  AND  assigned_account_manager <> ''
ON CONFLICT (prospect_id, am_email) DO NOTHING;

-- ─── 4. Update RLS policies on prospects to use junction table ────────────

-- Drop old single-column AM policies
DROP POLICY IF EXISTS "AMs see only their assigned prospects"    ON prospects;
DROP POLICY IF EXISTS "AMs can delete assigned prospects"        ON prospects;
DROP POLICY IF EXISTS "AMs can update their assigned prospects"  ON prospects;

-- Recreate using junction table
CREATE POLICY "AMs see their assigned prospects" ON prospects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
        AND pam.am_email    = public.current_user_email()
    )
  );

CREATE POLICY "AMs can update their assigned prospects" ON prospects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
        AND pam.am_email    = public.current_user_email()
    )
  );

CREATE POLICY "AMs can delete their assigned prospects" ON prospects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
        AND pam.am_email    = public.current_user_email()
    )
  );
