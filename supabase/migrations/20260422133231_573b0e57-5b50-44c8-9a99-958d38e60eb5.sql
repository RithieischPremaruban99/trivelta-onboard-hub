DROP POLICY IF EXISTS "Public can read prospect by token" ON public.prospects;
DROP POLICY IF EXISTS "Public can update prospect by token" ON public.prospects;

CREATE POLICY "Anon can read prospects with valid token" ON public.prospects
  FOR SELECT TO anon
  USING (access_token IS NOT NULL AND token_expires_at > now());

CREATE POLICY "Anon can update prospects with valid token" ON public.prospects
  FOR UPDATE TO anon
  USING (access_token IS NOT NULL AND token_expires_at > now())
  WITH CHECK (access_token IS NOT NULL AND token_expires_at > now());