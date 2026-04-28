DELETE FROM public.clients
WHERE name IN ('Test', 'Test Client', 'sdsd')
  AND created_at >= '2026-04-28';