
CREATE POLICY "staff roles visible" ON public.user_roles FOR SELECT TO authenticated
USING (role IN ('hr'::app_role,'admin'::app_role));

CREATE OR REPLACE FUNCTION public.staff_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('hr','admin'))
$$;
