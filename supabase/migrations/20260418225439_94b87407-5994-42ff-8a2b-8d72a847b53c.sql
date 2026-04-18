-- Allow am_user_id to be null and add am_email
ALTER TABLE public.client_account_managers
  ALTER COLUMN am_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS am_email TEXT;

-- Ensure at least one identifier present
ALTER TABLE public.client_account_managers
  DROP CONSTRAINT IF EXISTS cam_user_or_email;
ALTER TABLE public.client_account_managers
  ADD CONSTRAINT cam_user_or_email CHECK (am_user_id IS NOT NULL OR am_email IS NOT NULL);

-- Prevent duplicates per client/email
CREATE UNIQUE INDEX IF NOT EXISTS cam_unique_client_email
  ON public.client_account_managers(client_id, am_email) WHERE am_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cam_unique_client_user
  ON public.client_account_managers(client_id, am_user_id) WHERE am_user_id IS NOT NULL;

-- Add policy so AMs can read assignments matching their email (pre-signin assignments
-- become visible the moment they sign in even before backfill)
DROP POLICY IF EXISTS "AMs read own assignments by email" ON public.client_account_managers;
CREATE POLICY "AMs read own assignments by email"
  ON public.client_account_managers
  FOR SELECT
  TO authenticated
  USING (am_email IS NOT NULL AND am_email = public.current_user_email());

-- Backfill am_user_id -> am_email when possible (for existing rows)
UPDATE public.client_account_managers cam
SET am_email = p.email
FROM public.profiles p
WHERE cam.am_user_id = p.user_id AND cam.am_email IS NULL;

-- When a new user signs in, link their user_id to any existing assignments by email
CREATE OR REPLACE FUNCTION public.link_am_assignments_on_signin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_account_managers
  SET am_user_id = NEW.id
  WHERE am_email = NEW.email AND am_user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_am_assignments_trigger ON public.profiles;
CREATE TRIGGER link_am_assignments_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_am_assignments_on_signin();