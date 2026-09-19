CREATE TABLE public.portfolio_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  portfolio_url TEXT NOT NULL,
  page_title TEXT,
  overall_strength TEXT NOT NULL DEFAULT 'needs_evidence',
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_repo_links TEXT[] NOT NULL DEFAULT '{}',
  detected_demo_links TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (employee_id, portfolio_url)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_verifications TO authenticated;
GRANT ALL ON public.portfolio_verifications TO service_role;

ALTER TABLE public.portfolio_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio checks visible to owner or staff"
  ON public.portfolio_verifications FOR SELECT TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "Owner or staff can add portfolio checks"
  ON public.portfolio_verifications FOR INSERT TO authenticated
  WITH CHECK (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "Owner or staff can update portfolio checks"
  ON public.portfolio_verifications FOR UPDATE TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE POLICY "Owner or staff can delete portfolio checks"
  ON public.portfolio_verifications FOR DELETE TO authenticated
  USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

CREATE TRIGGER portfolio_verifications_updated_at
  BEFORE UPDATE ON public.portfolio_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();