-- Public RPC so the Welcome Gate can load data without auth
CREATE OR REPLACE FUNCTION public.get_client_welcome_info(_client_id UUID)
RETURNS TABLE (
  client_name TEXT,
  drive_link  TEXT,
  am_name     TEXT,
  am_email    TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.name::TEXT,
    c.drive_link::TEXT,
    p.name::TEXT,
    p.email::TEXT
  FROM public.clients c
  LEFT JOIN public.profiles p ON p.user_id = c.assigned_am_id
  WHERE c.id = _client_id
  LIMIT 1;
$$;
