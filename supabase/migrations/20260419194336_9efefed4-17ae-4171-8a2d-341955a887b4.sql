DELETE FROM public.onboarding_tasks WHERE client_id IN (SELECT id FROM public.clients WHERE name ILIKE '%test%');
DELETE FROM public.onboarding_forms WHERE client_id IN (SELECT id FROM public.clients WHERE name ILIKE '%test%');
DELETE FROM public.form_submissions WHERE client_id IN (SELECT id FROM public.clients WHERE name ILIKE '%test%');
DELETE FROM public.team_members WHERE client_id IN (SELECT id FROM public.clients WHERE name ILIKE '%test%');
DELETE FROM public.client_account_managers WHERE client_id IN (SELECT id FROM public.clients WHERE name ILIKE '%test%');
DELETE FROM public.clients WHERE name ILIKE '%test%';