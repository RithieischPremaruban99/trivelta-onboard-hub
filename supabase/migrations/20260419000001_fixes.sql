-- ─── Fix 1: submit_onboarding_form - remove client_role type dependency ────────
-- The old version declared `_role client_role` and called get_client_role()
-- which checks the legacy client_memberships table.  Replace with
-- is_client_owner() which checks the canonical team_members table.
CREATE OR REPLACE FUNCTION public.submit_onboarding_form(
  _client_id UUID,
  _data      JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller TEXT;
BEGIN
  _caller := current_user_email();

  IF NOT is_client_owner(_client_id) THEN
    RAISE EXCEPTION 'Only the client owner may submit this onboarding form';
  END IF;

  -- Update the live draft form and mark as submitted
  UPDATE public.onboarding_forms
  SET data         = _data,
      submitted_at = now()
  WHERE client_id = _client_id;

  IF NOT FOUND THEN
    INSERT INTO public.onboarding_forms (client_id, data, submitted_at)
    VALUES (_client_id, _data, now());
  END IF;

  -- Write an immutable audit record
  INSERT INTO public.onboarding_submissions (client_id, form_data, submitted_by)
  VALUES (_client_id, _data, _caller)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_onboarding_form(UUID, JSONB) TO authenticated;


-- ─── Fix 2: get_client_welcome_info - use junction table instead of assigned_am_id ─
-- The old version joined profiles ON p.user_id = c.assigned_am_id.
-- AMs haven't signed in yet so profiles is empty → am_name/am_email always NULL.
-- New version joins client_account_managers → role_assignments (email-based, no
-- auth.users row required).
CREATE OR REPLACE FUNCTION public.get_client_welcome_info(_client_id uuid)
RETURNS TABLE (
  client_name  text,
  am_name      text,
  am_email     text,
  am_title     text,
  progress_pct integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
  _done  integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
  INTO _total, _done
  FROM public.onboarding_tasks
  WHERE client_id = _client_id;

  RETURN QUERY
  SELECT
    c.name::text,
    ra.name::text,
    cam.am_email::text,
    'Account Manager'::text,
    CASE WHEN COALESCE(_total, 0) = 0 THEN 0
         ELSE ((_done::numeric / _total::numeric) * 100)::integer
    END
  FROM public.clients c
  LEFT JOIN public.client_account_managers cam
         ON cam.client_id = c.id
  LEFT JOIN public.role_assignments ra
         ON ra.email = cam.am_email
  WHERE c.id = _client_id
  ORDER BY cam.created_at
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_welcome_info(uuid) TO anon, authenticated;
