ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS notion_page_id text,
  ADD COLUMN IF NOT EXISTS notion_sync_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notion_sync_error text,
  ADD COLUMN IF NOT EXISTS notion_sync_attempted_at timestamptz;