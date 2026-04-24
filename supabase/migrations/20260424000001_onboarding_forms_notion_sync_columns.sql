-- Add notion sync error tracking columns to onboarding_forms.
-- notion_sync_pending already exists; these two columns let admins see
-- what went wrong and when it was attempted.

ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS notion_sync_error text,
  ADD COLUMN IF NOT EXISTS notion_sync_attempted_at timestamptz;
