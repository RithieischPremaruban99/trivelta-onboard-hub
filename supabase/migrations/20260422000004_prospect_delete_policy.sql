-- Migration: add DELETE policies for prospects table
-- Without these, RLS silently swallows deletes (no error, no rows removed).
-- Apply manually via Supabase dashboard SQL editor.

-- Admins (and account_executives) can delete any prospect
CREATE POLICY "Admins can delete prospects" ON public.prospects
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_executive')
  );

-- AMs can delete only their assigned prospects
CREATE POLICY "AMs can delete assigned prospects" ON public.prospects
  FOR DELETE USING (
    public.has_role(auth.uid(), 'account_manager') AND
    assigned_account_manager = public.current_user_email()
  );
