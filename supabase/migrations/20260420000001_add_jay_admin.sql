-- Ensure jay@trivelta.com has admin role in role_assignments
INSERT INTO public.role_assignments (email, name, role)
VALUES ('jay@trivelta.com', 'Jay', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
