CREATE OR REPLACE FUNCTION public.get_client_welcome_info(_client_id uuid)
 RETURNS TABLE(client_name text, am_name text, am_email text, am_title text, progress_pct integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total integer;
  _done  integer;
  _client_name text;
  _am_names text;
  _am_emails text;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
  INTO _total, _done
  FROM public.onboarding_tasks
  WHERE client_id = _client_id;

  SELECT c.name INTO _client_name
  FROM public.clients c
  WHERE c.id = _client_id;

  -- Aggregate ALL assigned AMs for this client (joined by " & ")
  SELECT
    string_agg(COALESCE(ra.name, cam.am_email), ' & ' ORDER BY cam.created_at),
    string_agg(cam.am_email,                     ', '  ORDER BY cam.created_at)
  INTO _am_names, _am_emails
  FROM public.client_account_managers cam
  LEFT JOIN public.role_assignments ra ON ra.email = cam.am_email
  WHERE cam.client_id = _client_id
    AND cam.am_email IS NOT NULL;

  RETURN QUERY
  SELECT
    _client_name::text,
    _am_names::text,
    _am_emails::text,
    'Account Manager'::text,
    CASE WHEN COALESCE(_total, 0) = 0 THEN 0
         ELSE ((_done::numeric / _total::numeric) * 100)::integer
    END;
END;
$function$;