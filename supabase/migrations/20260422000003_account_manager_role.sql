-- Migration: Account Manager permission system + audit trail
-- Apply manually via Supabase dashboard SQL editor.

-- ─── 1. Client Activity Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES clients(id) ON DELETE CASCADE,  -- nullable for prospect-level events
  actor_user_id uuid REFERENCES auth.users(id),
  actor_email  text NOT NULL,
  actor_role   text NOT NULL,
  action       text NOT NULL,
  details      jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_client  ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor   ON client_activity_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON client_activity_log(created_at DESC);

ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view activity logs" ON client_activity_log
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  );

CREATE POLICY "Authenticated users can insert activity" ON client_activity_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 2. AMs see only their assigned clients ───────────────────────────────────
-- Uses existing is_assigned_am(_client_id) function (checks client_account_managers)
DROP POLICY IF EXISTS "AMs see assigned clients" ON public.clients;
CREATE POLICY "AMs see assigned clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'account_manager') AND
    public.is_assigned_am(id)
  );

-- ─── 3. Prospects RLS: split admin/AM access ─────────────────────────────────
-- Drop the combined policy and replace with scoped versions
DROP POLICY IF EXISTS "Admins and AMs can read prospects"  ON public.prospects;
DROP POLICY IF EXISTS "Admins and AMs can create prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins and AMs can update prospects" ON public.prospects;

CREATE POLICY "Admins see all prospects" ON public.prospects
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_executive')
  );

CREATE POLICY "AMs see assigned prospects" ON public.prospects
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'account_manager') AND
    assigned_account_manager = public.current_user_email()
  );

CREATE POLICY "Staff can create prospects" ON public.prospects
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  );

CREATE POLICY "Staff can update assigned prospects" ON public.prospects
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_executive') OR
    (
      public.has_role(auth.uid(), 'account_manager') AND
      assigned_account_manager = public.current_user_email()
    )
  );

-- Note: "Public can read/update prospect by token" policies are preserved from
-- the original prospect migration and continue to allow tokenised access.
