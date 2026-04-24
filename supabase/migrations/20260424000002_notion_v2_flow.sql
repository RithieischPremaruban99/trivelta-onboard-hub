-- Migration: add columns for Notion v2 flow + phase tracking
-- Apply after code deploy (columns are nullable + default-safe, so deploy order is flexible)
-- NOTE: timestamp 000002 used (000001 already taken by onboarding_forms_notion_sync_columns)

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notion_page_id text,
  ADD COLUMN IF NOT EXISTS notion_sync_pending boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notion_sync_error text,
  ADD COLUMN IF NOT EXISTS notion_sync_attempted_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_phase text,
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS go_live_date timestamptz,
  ADD COLUMN IF NOT EXISTS next_renewal_date date,
  ADD COLUMN IF NOT EXISTS health_score text;

-- Optional: index for admin dashboard banner ("failed notion syncs")
CREATE INDEX IF NOT EXISTS idx_clients_notion_sync_pending
  ON public.clients (notion_sync_pending)
  WHERE notion_sync_pending = true;

-- Optional: index for Notion page lookup by Trivelta client ID
CREATE INDEX IF NOT EXISTS idx_clients_notion_page_id
  ON public.clients (notion_page_id)
  WHERE notion_page_id IS NOT NULL;

COMMENT ON COLUMN public.clients.notion_page_id IS 'Notion page ID in Clients DB (31aac148-...). Populated by prospect-submitted-v2 edge function.';
COMMENT ON COLUMN public.clients.notion_sync_pending IS 'True if last Notion sync attempt failed. Admin dashboard surfaces these.';
COMMENT ON COLUMN public.clients.onboarding_phase IS 'Mirrors Notion "Onboarding Phase" select: Pre-Sale | Contract | Initial Setup | Full Config | Pre-Launch | Post-Launch';
