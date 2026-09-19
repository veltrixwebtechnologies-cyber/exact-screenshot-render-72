CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  external_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT ALL ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.employee_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  extracted_text text,
  detected_github_username text,
  detected_links text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_resumes TO authenticated;
GRANT ALL ON public.employee_resumes TO service_role;
ALTER TABLE public.employee_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes readable by owner or staff" ON public.employee_resumes
  FOR SELECT TO authenticated USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));
CREATE POLICY "resumes insert by owner" ON public.employee_resumes
  FOR INSERT TO authenticated WITH CHECK (public.owns_employee(employee_id));
CREATE POLICY "resumes update by owner" ON public.employee_resumes
  FOR UPDATE TO authenticated USING (public.owns_employee(employee_id));
CREATE POLICY "resumes delete by owner" ON public.employee_resumes
  FOR DELETE TO authenticated USING (public.owns_employee(employee_id));

CREATE TABLE public.github_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  github_username text NOT NULL,
  repo_name text NOT NULL,
  repo_url text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  primary_language text,
  languages text[] NOT NULL DEFAULT '{}',
  detected_tech text[] NOT NULL DEFAULT '{}',
  stars integer NOT NULL DEFAULT 0,
  last_pushed_at timestamptz,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, repo_url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_evidence TO authenticated;
GRANT ALL ON public.github_evidence TO service_role;
ALTER TABLE public.github_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "github evidence readable by owner or staff" ON public.github_evidence
  FOR SELECT TO authenticated USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));
CREATE POLICY "github evidence insert by owner" ON public.github_evidence
  FOR INSERT TO authenticated WITH CHECK (public.owns_employee(employee_id));
CREATE POLICY "github evidence update by owner" ON public.github_evidence
  FOR UPDATE TO authenticated USING (public.owns_employee(employee_id));
CREATE POLICY "github evidence delete by owner" ON public.github_evidence
  FOR DELETE TO authenticated USING (public.owns_employee(employee_id));

CREATE POLICY "resume files readable by owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resume files uploadable by owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resume files deletable by owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);