-- Update get_client_welcome_info to return ALL assigned AMs (not just one)
-- Uses client_account_managers table joined with profiles for names.
-- Multiple AMs are aggregated: names joined with " & ", emails with ",".

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
    -- Aggregate all AM names; fall back to email prefix if no profile name
    COALESCE(
      NULLIF(string_agg(
        COALESCE(NULLIF(TRIM(p.name), ''), split_part(cam.am_email, '@', 1)),
        ' & '
        ORDER BY COALESCE(NULLIF(TRIM(p.name), ''), cam.am_email)
      ), ''),
      NULL
    )::TEXT,
    -- First email (for mailto link); all emails comma-separated if needed
    COALESCE(
      NULLIF(string_agg(cam.am_email, ',' ORDER BY cam.am_email), ''),
      NULL
    )::TEXT
  FROM public.clients c
  LEFT JOIN public.client_account_managers cam ON cam.client_id = c.id
  LEFT JOIN public.profiles p ON p.email = cam.am_email
  WHERE c.id = _client_id
  GROUP BY c.id, c.name, c.drive_link;
$$;
