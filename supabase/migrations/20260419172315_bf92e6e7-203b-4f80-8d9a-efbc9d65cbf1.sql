ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS studio_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS studio_locked_at timestamptz;