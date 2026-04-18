-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'account_manager', 'client');
CREATE TYPE public.client_status AS ENUM ('onboarding', 'active', 'churned');

-- ===== UPDATED_AT helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER_ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== PRE-SEEDED ROLE MAP (matched by email at signup) =====
CREATE TABLE public.role_assignments (
  email TEXT PRIMARY KEY,
  role public.app_role NOT NULL,
  name TEXT
);
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTS =====
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  platform_url TEXT,
  drive_link TEXT,
  status public.client_status NOT NULL DEFAULT 'onboarding',
  assigned_am_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  primary_contact_email TEXT, -- email of the client user who can access this client's onboarding
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== ONBOARDING FORMS =====
CREATE TABLE public.onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id)
);
ALTER TABLE public.onboarding_forms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON public.onboarding_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== ONBOARDING TASKS =====
CREATE TABLE public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phase INT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT NOT NULL, -- 'INTERNAL' or 'CLIENT'
  sort_order INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_client ON public.onboarding_tasks(client_id);

-- ===== TEAM MEMBERS =====
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ===== SOP TASK TEMPLATE (used to seed new clients) =====
CREATE TABLE public.sop_task_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase INT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.sop_task_template ENABLE ROW LEVEL SECURITY;

-- ===== SECURITY DEFINER ROLE HELPERS =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- ===== AUTO-CREATE PROFILE + ASSIGN ROLE ON SIGNUP =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _name TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (user_id) DO NOTHING;

  -- Lookup pre-seeded role
  SELECT role, name INTO _role, _name FROM public.role_assignments WHERE email = NEW.email;

  IF _role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
      ON CONFLICT DO NOTHING;
    IF _name IS NOT NULL THEN
      UPDATE public.profiles SET name = _name WHERE user_id = NEW.id AND name IS NULL;
    END IF;
  ELSE
    -- Default to client (will only see clients where primary_contact_email matches)
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- profiles: anyone authenticated can read (needed for AM names); only owner/admin can update
CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_roles: user can read own roles; admin can read all
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- role_assignments: admin only
CREATE POLICY "admins manage role assignments" ON public.role_assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- clients: admin sees all; AM sees assigned; client sees own (by primary_contact_email)
CREATE POLICY "admins all clients" ON public.clients
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "AMs read assigned clients" ON public.clients
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'account_manager') AND assigned_am_id = auth.uid()
  );
CREATE POLICY "AMs update assigned clients" ON public.clients
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'account_manager') AND assigned_am_id = auth.uid()
  );
CREATE POLICY "clients read own" ON public.clients
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'client') AND primary_contact_email = public.current_user_email()
  );

-- onboarding_forms: same access pattern via client
CREATE POLICY "admins all forms" ON public.onboarding_forms
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "AMs read forms of assigned" ON public.onboarding_forms
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.assigned_am_id = auth.uid())
  );
CREATE POLICY "clients read own form" ON public.onboarding_forms
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );
CREATE POLICY "clients upsert own form" ON public.onboarding_forms
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );
CREATE POLICY "clients update own form" ON public.onboarding_forms
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );

-- onboarding_tasks
CREATE POLICY "admins all tasks" ON public.onboarding_tasks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "AMs read tasks of assigned" ON public.onboarding_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.assigned_am_id = auth.uid())
  );
CREATE POLICY "AMs update tasks of assigned" ON public.onboarding_tasks
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.assigned_am_id = auth.uid())
  );
CREATE POLICY "clients read own tasks" ON public.onboarding_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );
CREATE POLICY "clients update client tasks" ON public.onboarding_tasks
  FOR UPDATE TO authenticated USING (
    owner = 'CLIENT' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );

-- team_members
CREATE POLICY "admins all team_members" ON public.team_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "AMs read team_members" ON public.team_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.assigned_am_id = auth.uid())
  );
CREATE POLICY "clients manage own team_members" ON public.team_members
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.primary_contact_email = public.current_user_email())
  );

-- sop_task_template: anyone authenticated can read; admin manages
CREATE POLICY "authenticated read sop template" ON public.sop_task_template
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage sop template" ON public.sop_task_template
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TRIGGER: auto-seed tasks when a new client is created =====
CREATE OR REPLACE FUNCTION public.seed_client_tasks()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.onboarding_tasks (client_id, phase, task, owner, sort_order)
  SELECT NEW.id, phase, task, owner, sort_order FROM public.sop_task_template;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_seed_client_tasks
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.seed_client_tasks();
