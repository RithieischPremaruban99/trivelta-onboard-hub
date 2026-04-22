-- ─── Storage bucket: onboarding-media ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-media',
  'onboarding-media',
  true,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: any authenticated user can upload to their client's folder
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'onboarding-media');

-- Storage RLS: owners can update/replace their uploads
CREATE POLICY "Authenticated users can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'onboarding-media');

-- Storage RLS: public read (bucket is public anyway, but explicit is better)
CREATE POLICY "Public can read media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'onboarding-media');

-- Storage RLS: authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'onboarding-media');

-- ─── onboarding_submissions table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  form_data     JSONB       NOT NULL,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_by  TEXT        NOT NULL -- email of submitter
);

ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Trivelta admins can read all submissions
CREATE POLICY "Admins can read submissions"
  ON public.onboarding_submissions FOR SELECT
  TO authenticated
  USING (has_role('admin'));

-- Client members can read their own client's submission
CREATE POLICY "Client members can read own submission"
  ON public.onboarding_submissions FOR SELECT
  TO authenticated
  USING (is_client_member(client_id));

-- No direct inserts from clients - done via submit_onboarding_form RPC only
CREATE POLICY "No direct client inserts"
  ON public.onboarding_submissions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ─── Update submit_onboarding_form to also write to onboarding_submissions ───
CREATE OR REPLACE FUNCTION public.submit_onboarding_form(
  _client_id UUID,
  _data      JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role     client_role;
  _caller   TEXT;
BEGIN
  _caller := current_user_email();
  _role   := get_client_role(_client_id);

  IF _role IS DISTINCT FROM 'client_owner' THEN
    RAISE EXCEPTION 'Only the client owner may submit this onboarding form';
  END IF;

  -- Mark the live form as submitted
  UPDATE public.onboarding_forms
  SET data         = _data,
      submitted_at = now()
  WHERE client_id = _client_id;

  IF NOT FOUND THEN
    INSERT INTO public.onboarding_forms (client_id, data, submitted_at)
    VALUES (_client_id, _data, now());
  END IF;

  -- Persist a permanent submission record
  INSERT INTO public.onboarding_submissions (client_id, form_data, submitted_by)
  VALUES (_client_id, _data, _caller)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_onboarding_form(UUID, JSONB) TO authenticated;
