ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS landing_pages_submitted_at timestamptz;