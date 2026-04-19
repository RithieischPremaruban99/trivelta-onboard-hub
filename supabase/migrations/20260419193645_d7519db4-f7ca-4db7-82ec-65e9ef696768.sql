ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notion_page_id text,
  ADD COLUMN IF NOT EXISTS studio_locked_at timestamp with time zone;