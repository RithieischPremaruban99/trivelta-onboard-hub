ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS affiliate_marketing_existing boolean,
  ADD COLUMN IF NOT EXISTS affiliate_marketing_system text,
  ADD COLUMN IF NOT EXISTS affiliate_marketing_system_other text,
  ADD COLUMN IF NOT EXISTS payment_providers_other text;
