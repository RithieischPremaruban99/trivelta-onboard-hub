-- Add studio_config JSONB column to onboarding_forms
-- Stores the client's platform color customization from the Studio chat interface.
ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS studio_config JSONB;
