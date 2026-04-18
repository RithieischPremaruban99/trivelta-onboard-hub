-- Public bucket for onboarding media (logos, icons, animations)
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-media', 'onboarding-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: files live under {client_id}/...
-- Public read (bucket is public)
CREATE POLICY "Public read onboarding-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-media');

-- Team members can upload to their own client folder
CREATE POLICY "Team members upload onboarding-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'onboarding-media'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
    OR public.is_client_team_member(((storage.foldername(name))[1])::uuid)
  )
);

-- Team members can update files in their client folder
CREATE POLICY "Team members update onboarding-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'onboarding-media'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
    OR public.is_client_team_member(((storage.foldername(name))[1])::uuid)
  )
);

-- Owners (and admins/AMs) can delete
CREATE POLICY "Owners delete onboarding-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'onboarding-media'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
    OR public.is_client_owner(((storage.foldername(name))[1])::uuid)
  )
);

-- Submissions audit log
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_email text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_form_submissions_client_id ON public.form_submissions(client_id);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins all submissions"
ON public.form_submissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "AMs read submissions of assigned"
ON public.form_submissions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.clients c
  WHERE c.id = form_submissions.client_id
    AND c.assigned_am_id = auth.uid()
));

CREATE POLICY "team members read submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (public.is_client_team_member(client_id));

-- Trigger: log to form_submissions whenever submitted_at transitions to non-null
CREATE OR REPLACE FUNCTION public.log_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.submitted_at IS DISTINCT FROM NEW.submitted_at) THEN
    INSERT INTO public.form_submissions (
      client_id, submitted_by, submitted_by_email, submitted_at, data_snapshot
    ) VALUES (
      NEW.client_id,
      auth.uid(),
      public.current_user_email(),
      NEW.submitted_at,
      NEW.data
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_form_submission_after_update
AFTER UPDATE ON public.onboarding_forms
FOR EACH ROW EXECUTE FUNCTION public.log_form_submission();

CREATE TRIGGER log_form_submission_after_insert
AFTER INSERT ON public.onboarding_forms
FOR EACH ROW EXECUTE FUNCTION public.log_form_submission();