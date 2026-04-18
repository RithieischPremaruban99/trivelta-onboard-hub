-- 1. client_roles on team_members
CREATE TYPE public.client_member_role AS ENUM ('client_owner', 'client_member');

ALTER TABLE public.team_members
  ADD COLUMN client_role public.client_member_role NOT NULL DEFAULT 'client_member';

-- Auto-insert client_owner row when client is created
CREATE OR REPLACE FUNCTION public.seed_client_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.primary_contact_email IS NOT NULL THEN
    INSERT INTO public.team_members (client_id, email, client_role)
    VALUES (NEW.id, NEW.primary_contact_email, 'client_owner')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_client_owner_after_insert
AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.seed_client_owner();

-- Helper: is current user an owner for this client?
CREATE OR REPLACE FUNCTION public.is_client_owner(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.client_id = _client_id
      AND tm.email = public.current_user_email()
      AND tm.client_role = 'client_owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client_team_member(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.client_id = _client_id
      AND tm.email = public.current_user_email()
  );
$$;

-- Update onboarding_forms RLS: members can read/update, only owners can submit
DROP POLICY IF EXISTS "clients read own form" ON public.onboarding_forms;
DROP POLICY IF EXISTS "clients update own form" ON public.onboarding_forms;
DROP POLICY IF EXISTS "clients upsert own form" ON public.onboarding_forms;

CREATE POLICY "team members read form"
ON public.onboarding_forms FOR SELECT TO authenticated
USING (
  public.is_client_team_member(client_id)
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = onboarding_forms.client_id AND c.primary_contact_email = public.current_user_email())
);

CREATE POLICY "team members upsert form"
ON public.onboarding_forms FOR INSERT TO authenticated
WITH CHECK (
  public.is_client_team_member(client_id)
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = onboarding_forms.client_id AND c.primary_contact_email = public.current_user_email())
);

CREATE POLICY "team members update form fields"
ON public.onboarding_forms FOR UPDATE TO authenticated
USING (
  public.is_client_team_member(client_id)
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = onboarding_forms.client_id AND c.primary_contact_email = public.current_user_email())
);

-- Trigger to enforce: only owners can set submitted_at
CREATE OR REPLACE FUNCTION public.enforce_owner_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If submitted_at is being set/changed by a non-admin, require owner
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    IF NOT public.has_role(auth.uid(), 'admin')
       AND NOT public.has_role(auth.uid(), 'account_manager')
       AND NOT public.is_client_owner(NEW.client_id) THEN
      RAISE EXCEPTION 'Only client owners can submit the onboarding form';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_owner_submit_trigger
BEFORE UPDATE ON public.onboarding_forms
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_submit();

-- Same for INSERT (in case form is created already-submitted)
CREATE OR REPLACE FUNCTION public.enforce_owner_submit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin')
       AND NOT public.has_role(auth.uid(), 'account_manager')
       AND NOT public.is_client_owner(NEW.client_id) THEN
      RAISE EXCEPTION 'Only client owners can submit the onboarding form';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_owner_submit_insert_trigger
BEFORE INSERT ON public.onboarding_forms
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_submit_insert();

-- Backfill: ensure existing clients have a client_owner team_members row
INSERT INTO public.team_members (client_id, email, client_role)
SELECT c.id, c.primary_contact_email, 'client_owner'
FROM public.clients c
WHERE c.primary_contact_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.client_id = c.id AND tm.email = c.primary_contact_email
  );

-- 2. welcome_info_rpc
CREATE OR REPLACE FUNCTION public.get_client_welcome_info(_client_id uuid)
RETURNS TABLE (
  client_name text,
  am_name text,
  am_email text,
  am_title text,
  progress_pct integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
  _done integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
  INTO _total, _done
  FROM public.onboarding_tasks
  WHERE client_id = _client_id;

  RETURN QUERY
  SELECT
    c.name,
    p.name,
    p.email,
    'Account Manager'::text,
    CASE WHEN COALESCE(_total, 0) = 0 THEN 0
         ELSE ((_done::numeric / _total::numeric) * 100)::integer END
  FROM public.clients c
  LEFT JOIN public.profiles p ON p.user_id = c.assigned_am_id
  WHERE c.id = _client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_welcome_info(uuid) TO anon, authenticated;

-- 3. Realtime on onboarding_forms
ALTER TABLE public.onboarding_forms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_forms;
