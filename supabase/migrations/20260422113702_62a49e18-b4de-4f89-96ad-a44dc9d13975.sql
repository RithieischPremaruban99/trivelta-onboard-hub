CREATE POLICY "Admins can delete prospects" ON public.prospects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'account_executive')
    )
  );

CREATE POLICY "AMs can delete assigned prospects" ON public.prospects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'account_manager'
    )
    AND assigned_account_manager = public.current_user_email()
  );