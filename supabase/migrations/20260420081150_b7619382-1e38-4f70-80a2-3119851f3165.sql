-- Add notion_sync_pending column for retry tracking
ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS notion_sync_pending boolean NOT NULL DEFAULT false;

-- Replace overly broad public SELECT policy on studio-assets
-- Files are still served publicly via the /object/public/ URL (which uses service role),
-- but anon clients can no longer enumerate / list bucket contents.
DROP POLICY IF EXISTS "Studio assets publicly readable" ON storage.objects;

CREATE POLICY "Studio assets readable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'studio-assets');