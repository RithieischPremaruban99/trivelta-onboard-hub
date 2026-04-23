-- Create landing-page-assets storage bucket (public for serving brand logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-page-assets', 'landing-page-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy 1: Authenticated users can upload to their own folder (user_id/clientId/...)
CREATE POLICY "Users can upload landing page assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Authenticated users can read their own assets
CREATE POLICY "Users can read own landing page assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Authenticated users can update their own assets
CREATE POLICY "Users can update own landing page assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Public read access (bucket is public, needed for landing pages to embed logos)
CREATE POLICY "Public can read landing page assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'landing-page-assets');

-- Policy 5: Admins / AEs / AMs can manage all landing page assets
CREATE POLICY "Staff can manage landing page assets"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'landing-page-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  )
);