-- ─── 1. Add unique constraint so ON CONFLICT works ───────────────────────────
-- team_members had no unique key on (client_id, email); triggers were using
-- SELECT … WHERE NOT EXISTS guards instead.  Add it now so the registration
-- function below can use ON CONFLICT safely.
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_client_email_unique UNIQUE (client_id, email);


-- ─── 2. register_onboarding_visitor ──────────────────────────────────────────
-- Called from the frontend immediately after a user signs in via magic link.
-- Inserts the user as 'client_member' for the given client if they don't
-- already have a team_members row.  If they're already the client_owner
-- (seeded from primary_contact_email at client creation) the ON CONFLICT
-- clause is a no-op, preserving their role.
CREATE OR REPLACE FUNCTION public.register_onboarding_visitor(_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: only proceed if the client actually exists
  INSERT INTO public.team_members (client_id, email, client_role)
  SELECT _client_id, current_user_email(), 'client_member'
  FROM public.clients
  WHERE id = _client_id
  ON CONFLICT ON CONSTRAINT team_members_client_email_unique DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_onboarding_visitor(uuid) TO authenticated;
