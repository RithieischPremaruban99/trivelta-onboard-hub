-- Create the studio-assets storage bucket for persisting generated logos.
-- Public read so URLs are stable and usable by Claude Vision.
-- Authenticated write so only logged-in users (the edge function uses service role) can upload.

INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read studio assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'studio-assets');

CREATE POLICY "Authenticated upload studio assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'studio-assets');
