CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_company_name text NOT NULL,
  primary_contact_email text NOT NULL,
  primary_contact_name text,
  primary_contact_phone text,
  access_token text NOT NULL UNIQUE,
  token_expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  company_details jsonb DEFAULT '{}'::jsonb,
  payment_providers jsonb DEFAULT '{}'::jsonb,
  kyc_compliance jsonb DEFAULT '{}'::jsonb,
  marketing_stack jsonb DEFAULT '{}'::jsonb,
  technical_requirements jsonb DEFAULT '{}'::jsonb,
  optional_features jsonb DEFAULT '{}'::jsonb,
  contract_status text DEFAULT 'in_discussion'
    CHECK (contract_status IN ('in_discussion', 'term_sheet', 'contract_sent', 'under_legal_review', 'ready_to_sign', 'signed')),
  form_progress integer DEFAULT 0 CHECK (form_progress >= 0 AND form_progress <= 100),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  assigned_account_manager text,
  converted_to_client_id uuid REFERENCES public.clients(id),
  converted_at timestamptz,
  notion_page_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz,
  submitted_at timestamptz
);

CREATE INDEX idx_prospects_token ON prospects(access_token);
CREATE INDEX idx_prospects_contract_status ON prospects(contract_status);
CREATE INDEX idx_prospects_created_by ON prospects(created_by);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and AMs can read prospects" ON prospects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'account_manager'))
  );

CREATE POLICY "Admins and AMs can create prospects" ON prospects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'account_manager'))
  );

CREATE POLICY "Admins and AMs can update prospects" ON prospects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'account_manager'))
  );

CREATE POLICY "Public can read prospect by token" ON prospects
  FOR SELECT USING (true);

CREATE POLICY "Public can update prospect by token" ON prospects
  FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.update_prospects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prospects_updated_at();