-- Migration: Allow access_token to be NULL on prospects
-- Apply manually via Supabase dashboard SQL editor.
--
-- Conversion flow sets access_token = null to invalidate magic links after
-- prospect converts to client. The original NOT NULL constraint prevents this.
-- Dropping NOT NULL allows the conversion UPDATE to succeed.
-- Token uniqueness constraint remains via the existing UNIQUE index which
-- handles nulls correctly in PostgreSQL (each NULL is distinct).

ALTER TABLE prospects ALTER COLUMN access_token DROP NOT NULL;
