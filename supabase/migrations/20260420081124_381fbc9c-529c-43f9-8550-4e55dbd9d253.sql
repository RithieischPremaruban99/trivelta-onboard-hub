-- Create studio-assets storage bucket for generated logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access
CREATE POLICY "Studio assets publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-assets');

-- Service role uploads (edge function uses service role key, bypasses RLS - but add for completeness)
CREATE POLICY "Authenticated users can upload studio assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-assets');

CREATE POLICY "Authenticated users can update studio assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-assets');