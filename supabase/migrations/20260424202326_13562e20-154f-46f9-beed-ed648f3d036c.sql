DELETE FROM client_activity_log WHERE client_id = 'f664fcda-e65c-4124-9673-8494dab34105';
DELETE FROM client_account_managers WHERE client_id = 'f664fcda-e65c-4124-9673-8494dab34105';
DELETE FROM onboarding_forms WHERE client_id = 'f664fcda-e65c-4124-9673-8494dab34105';
DELETE FROM onboarding_tasks WHERE client_id = 'f664fcda-e65c-4124-9673-8494dab34105';
DELETE FROM team_members WHERE client_id = 'f664fcda-e65c-4124-9673-8494dab34105';
UPDATE prospects SET converted_to_client_id = NULL WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM clients WHERE id = 'f664fcda-e65c-4124-9673-8494dab34105';
DELETE FROM prospect_account_managers WHERE prospect_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM prospects WHERE id = '22222222-2222-2222-2222-222222222222';