
CREATE OR REPLACE FUNCTION public.staff_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('hr','admin'))
$$;
REVOKE EXECUTE ON FUNCTION public.staff_exists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_exists() TO authenticated, service_role;

DROP POLICY IF EXISTS "claim own employee or hr role" ON public.user_roles;

CREATE POLICY "claim own employee role" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'employee'::app_role);

CREATE POLICY "bootstrap first staff role" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role IN ('hr'::app_role,'admin'::app_role) AND NOT public.staff_exists());

CREATE POLICY "admins grant roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins revoke roles" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
