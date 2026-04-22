ALTER TABLE prospects 
  ADD COLUMN IF NOT EXISTS update_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS update_request_reason text;