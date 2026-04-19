-- Track whether the design-locked Notion sync is pending retry.
-- Set to true when the design-locked edge function fails (e.g. Notion is down).
-- Cleared to false on next successful invocation (retried from dashboard load).

ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS notion_sync_pending boolean NOT NULL DEFAULT false;
