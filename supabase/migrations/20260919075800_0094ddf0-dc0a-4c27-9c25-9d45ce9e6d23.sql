
DROP POLICY IF EXISTS "bootstrap first staff role" ON public.user_roles;
DROP FUNCTION IF EXISTS public.staff_exists();

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'admin'::app_role FROM public.user_roles WHERE role = 'hr'::app_role
ON CONFLICT (user_id, role) DO NOTHING;
