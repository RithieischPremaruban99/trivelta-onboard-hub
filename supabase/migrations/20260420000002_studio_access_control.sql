-- Studio access control: AE grants access before client can open Studio
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS studio_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS studio_access_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS studio_access_granted_by uuid REFERENCES auth.users(id);
