-- Add opaque access token to clients table.
-- Generated at convert time in convert-prospect-to-client edge function.
-- Allows AE to permanently re-copy the client onboarding link from the admin UI.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_clients_access_token
  ON clients(access_token)
  WHERE access_token IS NOT NULL;

COMMENT ON COLUMN clients.access_token IS
  'Opaque token for magic-link onboarding access. Generated on prospect conversion.';
