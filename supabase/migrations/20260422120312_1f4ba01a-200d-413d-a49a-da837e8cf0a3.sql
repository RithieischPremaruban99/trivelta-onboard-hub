CREATE TABLE IF NOT EXISTS public.client_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid,
  prospect_id uuid,
  actor_user_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_id ON public.client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_prospect_id ON public.client_activity_log(prospect_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_created_at ON public.client_activity_log(created_at DESC);

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins all activity log"
ON public.client_activity_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "AEs all activity log"
ON public.client_activity_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'::app_role));

CREATE POLICY "AMs read activity log for assigned clients"
ON public.client_activity_log FOR SELECT TO authenticated
USING (client_id IS NOT NULL AND public.is_am_for_client(client_id));

CREATE POLICY "AMs read activity log for assigned prospects"
ON public.client_activity_log FOR SELECT TO authenticated
USING (
  prospect_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.prospects p
    WHERE p.id = prospect_id
      AND p.assigned_account_manager = public.current_user_email()
  )
);

CREATE POLICY "Authenticated insert own activity"
ON public.client_activity_log FOR INSERT TO authenticated
WITH CHECK (actor_user_id = auth.uid());