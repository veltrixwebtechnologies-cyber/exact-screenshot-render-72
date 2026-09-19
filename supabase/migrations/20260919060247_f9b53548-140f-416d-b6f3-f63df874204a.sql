CREATE TYPE public.app_role AS ENUM ('employee','hr','admin');

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  email text,
  department text,
  job_title text,
  location text,
  joining_date date,
  profile_summary text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency int NOT NULL DEFAULT 3,
  confidence numeric NOT NULL DEFAULT 0.7,
  source text NOT NULL DEFAULT 'Resume',
  evidence text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_id)
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  role text,
  technologies text[] NOT NULL DEFAULT '{}',
  outcomes text,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  impact text,
  date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course text NOT NULL,
  provider text,
  skills_gained text[] NOT NULL DEFAULT '{}',
  completion_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.internal_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  description text,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  experience_required int,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.role_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.internal_roles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level int NOT NULL DEFAULT 3,
  importance text NOT NULL DEFAULT 'required',
  UNIQUE (role_id, skill_id)
);

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question text NOT NULL,
  category text,
  answer text NOT NULL,
  detected_signals text[] NOT NULL DEFAULT '{}',
  step int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.talent_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  capability text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.6,
  evidence text[] NOT NULL DEFAULT '{}',
  explanation text,
  explore text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'AI inference',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  reason text,
  related_skill text,
  related_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.employees, public.user_roles, public.skills, public.employee_skills,
  public.projects, public.achievements, public.certifications, public.learning_records,
  public.internal_roles, public.role_skills, public.assessments, public.assessment_responses,
  public.talent_insights, public.recommendations TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('hr','admin'))
$$;

CREATE OR REPLACE FUNCTION public.owns_employee(_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.employees WHERE id = _employee_id AND user_id = auth.uid())
$$;

CREATE POLICY "roles readable by self and staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "claim own employee or hr role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('employee','hr'));

CREATE POLICY "employees readable" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees insert own or staff" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "employees update own or staff" ON public.employees FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "employees delete staff" ON public.employees FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "skills readable" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills insert" ON public.skills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "skills update staff" ON public.skills FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "employee_skills readable" ON public.employee_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_skills write" ON public.employee_skills FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "projects readable" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects write" ON public.projects FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "achievements readable" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "achievements write" ON public.achievements FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "certifications readable" ON public.certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "certifications write" ON public.certifications FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "learning readable" ON public.learning_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "learning write" ON public.learning_records FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "roles list readable" ON public.internal_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "internal_roles write staff" ON public.internal_roles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "role_skills readable" ON public.role_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_skills write staff" ON public.role_skills FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "assessments own or staff" ON public.assessments FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "assessment_responses own or staff" ON public.assessment_responses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND (public.owns_employee(a.employee_id) OR public.is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND (public.owns_employee(a.employee_id) OR public.is_staff(auth.uid()))));

CREATE POLICY "insights readable" ON public.talent_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "insights write" ON public.talent_insights FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "recommendations readable" ON public.recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "recommendations write" ON public.recommendations FOR ALL TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER employees_touch BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();