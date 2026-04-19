-- Add studio lock columns to onboarding_forms
-- studio_locked: client has finalised their design
-- studio_locked_at: timestamp when they locked it

ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS studio_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS studio_locked_at timestamptz;
