ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS studio_features jsonb
DEFAULT '{
  "landing_page_generator": true,
  "ai_chat": false,
  "color_editor": false,
  "animation_tools": false,
  "logo_editor": false,
  "asset_library": false
}'::jsonb;

UPDATE public.clients
SET studio_features = '{
  "landing_page_generator": true,
  "ai_chat": false,
  "color_editor": false,
  "animation_tools": false,
  "logo_editor": false,
  "asset_library": false
}'::jsonb
WHERE studio_features IS NULL;

CREATE OR REPLACE FUNCTION public.client_has_studio_feature(
  p_client_id uuid,
  p_feature text
)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (studio_features->p_feature)::boolean,
    false
  )
  FROM public.clients
  WHERE id = p_client_id;
$$;

GRANT EXECUTE ON FUNCTION public.client_has_studio_feature TO authenticated;