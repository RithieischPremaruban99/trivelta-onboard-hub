-- Replace broad public SELECT with: direct-URL reads stay public, but listing is scoped.
-- In Supabase Storage, both direct GET and LIST go through SELECT on storage.objects.
-- A public bucket already serves files via the public CDN endpoint without RLS,
-- so we can restrict storage.objects SELECT to authenticated team members safely.
DROP POLICY IF EXISTS "Public read onboarding-media" ON storage.objects;

CREATE POLICY "Team members read onboarding-media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'onboarding-media'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
    OR public.is_client_team_member(((storage.foldername(name))[1])::uuid)
  )
);