-- NOTE: The studio_access column was already added in migration
-- 20260420000002_studio_access_control.sql as `studio_access` (boolean, default false).
-- No schema change is required. This file documents the intent for audit purposes.
--
-- The column used throughout the codebase is: clients.studio_access (boolean)
-- Backfill existing test clients as granted (safe to run multiple times):
UPDATE clients
SET studio_access = true
WHERE name IN ('BetLion', 'Scorama Gaming Network Limited')
  AND studio_access = false;
