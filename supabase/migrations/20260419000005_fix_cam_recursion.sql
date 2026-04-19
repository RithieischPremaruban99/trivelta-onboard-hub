-- ─────────────────────────────────────────────────────────────────────────────
-- Fix infinite recursion in client_account_managers RLS
-- ─────────────────────────────────────────────────────────────────────────────
--
-- ROOT CAUSE
-- ----------
-- "AMs read assignments of their clients" on client_account_managers uses:
--   EXISTS (SELECT 1 FROM public.client_account_managers ...)
-- That subquery triggers client_account_managers' own RLS policies, which
-- includes itself → stack overflow / "infinite recursion detected in policy".
--
-- INDIRECT CAUSE
-- --------------
-- Four policies on other tables query client_account_managers inline (without
-- going through a SECURITY DEFINER function).  When those policies fire,
-- Postgres evaluates CAM's RLS policies including the recursive one above.
--   - "AMs (multi) read tasks"    ON onboarding_tasks  (created 20260418222433)
--   - "AMs (multi) update tasks"  ON onboarding_tasks
--   - "AMs (multi) read forms"    ON onboarding_forms
--   - "AMs (multi) read submissions" ON form_submissions
--
-- FIX
-- ---
-- 1. Create is_am_for_client() SECURITY DEFINER — queries CAM bypassing RLS.
-- 2. Replace the recursive CAM policy with one that uses this helper.
-- 3. Replace the four indirect-recursion policies with is_assigned_am()
--    (already SECURITY DEFINER from migration 20260419000003).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. SECURITY DEFINER helper ───────────────────────────────────────────────
--
-- Runs as the function owner (bypasses RLS on client_account_managers).
-- Safe to call from within policies on client_account_managers itself.

CREATE OR REPLACE FUNCTION public.is_am_for_client(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_account_managers
    WHERE client_id = _client_id
      AND (
        (am_user_id IS NOT NULL AND am_user_id = auth.uid())
        OR am_email = public.current_user_email()
      )
  );
$$;


-- ── 2. Fix the directly recursive policy on client_account_managers ──────────

DROP POLICY IF EXISTS "AMs read assignments of their clients"
  ON public.client_account_managers;

-- Replaced with a SECURITY DEFINER call — no self-referential subquery.
CREATE POLICY "AMs read assignments of their clients"
  ON public.client_account_managers
  FOR SELECT TO authenticated
  USING (public.is_am_for_client(client_id));


-- ── 3. Fix indirectly recursive policies on other tables ─────────────────────
--
-- These were created in 20260418222433 with inline CAM subqueries and were
-- never dropped by subsequent migrations (which only replaced differently-named
-- policies like "AMs read tasks of assigned").

-- onboarding_tasks
DROP POLICY IF EXISTS "AMs (multi) read tasks"   ON public.onboarding_tasks;
DROP POLICY IF EXISTS "AMs (multi) update tasks" ON public.onboarding_tasks;

CREATE POLICY "AMs (multi) read tasks"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

CREATE POLICY "AMs (multi) update tasks"
  ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (public.is_assigned_am(client_id));

-- onboarding_forms
DROP POLICY IF EXISTS "AMs (multi) read forms" ON public.onboarding_forms;

CREATE POLICY "AMs (multi) read forms"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

-- form_submissions
DROP POLICY IF EXISTS "AMs (multi) read submissions" ON public.form_submissions;

CREATE POLICY "AMs (multi) read submissions"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));
