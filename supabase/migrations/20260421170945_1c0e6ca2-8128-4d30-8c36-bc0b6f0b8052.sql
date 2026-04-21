ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS platform_live boolean NOT NULL DEFAULT false;