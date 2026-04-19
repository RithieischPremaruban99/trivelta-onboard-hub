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
  LEFT JOIN public.client_account_managers cam ON cam.client_id = c.id
  LEFT JOIN public.role_assignments ra ON ra.email = cam.am_email
  WHERE c.id = _client_id
  ORDER BY cam.created_at
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_welcome_info(uuid) TO anon, authenticated;