-- Create public bucket for landing page brand assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-page-assets', 'landing-page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Clients can upload into their own user-scoped folder
CREATE POLICY "Clients can upload own landing page assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients can read their own assets
CREATE POLICY "Clients can read own landing page assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read — generated HTML pages embed logo URLs that render without auth
CREATE POLICY "Public read for landing page assets"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'landing-page-assets');

-- Clients can replace/update their own assets
CREATE POLICY "Clients can update own landing page assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff (admin / AE / AM) can manage all assets
CREATE POLICY "Staff can manage all landing page assets"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'landing-page-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  )
);
