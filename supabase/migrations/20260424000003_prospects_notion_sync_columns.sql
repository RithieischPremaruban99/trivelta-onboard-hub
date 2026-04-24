-- Add Notion sync tracking columns to prospects table.
-- notion_page_id already exists (added in 20260422000001_add_prospects.sql).
-- These three columns mirror what clients already has from 20260424000002_notion_v2_flow.sql.

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS notion_sync_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notion_sync_error text,
  ADD COLUMN IF NOT EXISTS notion_sync_attempted_at timestamptz;
