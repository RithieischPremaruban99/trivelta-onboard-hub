-- Add notion_user_id to role_assignments so AM Notion IDs are managed in the DB
-- rather than hardcoded in edge functions.

ALTER TABLE public.role_assignments
  ADD COLUMN IF NOT EXISTS notion_user_id text;

-- Seed known Notion user IDs for existing account managers
UPDATE public.role_assignments SET notion_user_id = '318d872b-594c-816c-802b-00020900bb8f'
  WHERE email = 'aidan.kidd@trivelta.com';

UPDATE public.role_assignments SET notion_user_id = '318d872b-594c-81bf-a1fd-00026792dc67'
  WHERE email = 'davi.sirohi@trivelta.com';

UPDATE public.role_assignments SET notion_user_id = '318d872b-594c-815c-a2b2-00020f6b69d4'
  WHERE email = 'alex.serrato@trivelta.com';

UPDATE public.role_assignments SET notion_user_id = '344d872b-594c-8147-baac-000279c61d51'
  WHERE email = 'rithieisch.premaruban@trivelta.com';
