-- Re-apply security audit migration: prospect token RPCs, design lock helper, activity log RPC
DROP POLICY IF EXISTS "Public can read prospect by token"   ON public.prospects;
DROP POLICY IF EXISTS "Public can update prospect by token" ON public.prospects;

CREATE OR REPLACE FUNCTION public.get_prospect_by_token(p_token text)
RETURNS SETOF public.prospects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.prospects
  WHERE access_token   = p_token
    AND token_expires_at > now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_prospect_by_token(
  p_token  text,
  p_fields jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id                  uuid;
  v_submitted_at        timestamptz;
  v_update_requested_at timestamptz;
  v_locked              boolean;
BEGIN
  SELECT id, submitted_at, update_requested_at
  INTO   v_id, v_submitted_at, v_update_requested_at
  FROM   public.prospects
  WHERE  access_token   = p_token
    AND  token_expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  v_locked := v_submitted_at IS NOT NULL AND v_update_requested_at IS NULL;

  IF v_locked AND (
    p_fields ? 'company_details'        OR
    p_fields ? 'payment_providers'      OR
    p_fields ? 'kyc_compliance'         OR
    p_fields ? 'marketing_stack'        OR
    p_fields ? 'technical_requirements' OR
    p_fields ? 'optional_features'      OR
    p_fields ? 'form_progress'
  ) THEN
    RAISE EXCEPTION 'form_locked';
  END IF;

  UPDATE public.prospects SET
    company_details        = CASE WHEN p_fields ? 'company_details'        THEN p_fields->'company_details'                              ELSE company_details        END,
    payment_providers      = CASE WHEN p_fields ? 'payment_providers'      THEN p_fields->'payment_providers'                            ELSE payment_providers      END,
    kyc_compliance         = CASE WHEN p_fields ? 'kyc_compliance'         THEN p_fields->'kyc_compliance'                               ELSE kyc_compliance         END,
    marketing_stack        = CASE WHEN p_fields ? 'marketing_stack'        THEN p_fields->'marketing_stack'                              ELSE marketing_stack        END,
    technical_requirements = CASE WHEN p_fields ? 'technical_requirements' THEN p_fields->'technical_requirements'                       ELSE technical_requirements END,
    optional_features      = CASE WHEN p_fields ? 'optional_features'      THEN p_fields->'optional_features'                            ELSE optional_features      END,
    form_progress          = CASE WHEN p_fields ? 'form_progress'          THEN (p_fields->>'form_progress')::integer                    ELSE form_progress          END,
    last_accessed_at       = CASE WHEN p_fields ? 'last_accessed_at'       THEN (p_fields->>'last_accessed_at')::timestamptz             ELSE last_accessed_at       END,
    submitted_at           = CASE WHEN p_fields ? 'submitted_at'           THEN (p_fields->>'submitted_at')::timestamptz                 ELSE submitted_at           END,
    update_requested_at    = CASE WHEN p_fields ? 'update_requested_at'    THEN (p_fields->>'update_requested_at')::timestamptz          ELSE update_requested_at    END,
    update_request_reason  = CASE WHEN p_fields ? 'update_request_reason'  THEN p_fields->>'update_request_reason'                       ELSE update_request_reason  END
  WHERE id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_lock_design(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(p_user_id, 'admin') OR public.has_role(p_user_id, 'account_executive') THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.client_account_managers
    WHERE client_id = p_client_id
      AND (
        am_user_id = p_user_id
        OR am_email = (SELECT email FROM auth.users WHERE id = p_user_id)
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS "Authenticated insert own activity"      ON public.client_activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON public.client_activity_log;

CREATE POLICY "Staff can insert activity"
ON public.client_activity_log FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'account_executive') OR
  public.has_role(auth.uid(), 'account_manager')
);

CREATE OR REPLACE FUNCTION public.log_client_activity(
  p_client_id   uuid,
  p_action      text,
  p_details     jsonb    DEFAULT '{}'::jsonb,
  p_prospect_id uuid     DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_role    text;
BEGIN
  SELECT id, email
  INTO   v_user_id, v_email
  FROM   auth.users
  WHERE  id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT role::text INTO v_role
  FROM   public.user_roles
  WHERE  user_id = v_user_id
  LIMIT  1;

  INSERT INTO public.client_activity_log (
    client_id, prospect_id, actor_user_id, actor_email, actor_role, action, details
  ) VALUES (
    p_client_id,
    p_prospect_id,
    v_user_id,
    COALESCE(v_email, 'unknown'),
    COALESCE(v_role,  'unknown'),
    p_action,
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$$;

-- GRANT EXECUTE to anon + authenticated for token-gated RPCs
GRANT EXECUTE ON FUNCTION public.get_prospect_by_token(text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_prospect_by_token(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_lock_design(uuid, uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_client_activity(uuid, text, jsonb, uuid) TO authenticated;