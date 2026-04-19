ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS studio_access_locked boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Staff can update studio_access_locked" ON public.clients;
CREATE POLICY "Staff can update studio_access_locked"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  );

UPDATE public.clients SET country = 'Nigeria' WHERE country = 'nigeria';