
DROP POLICY IF EXISTS "employees readable" ON public.employees;
CREATE POLICY "employees readable own or staff" ON public.employees FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "employee_skills readable" ON public.employee_skills;
CREATE POLICY "employee_skills readable own or staff" ON public.employee_skills FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "insights readable" ON public.talent_insights;
CREATE POLICY "insights readable own or staff" ON public.talent_insights FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "projects readable" ON public.projects;
CREATE POLICY "projects readable own or staff" ON public.projects FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "achievements readable" ON public.achievements;
CREATE POLICY "achievements readable own or staff" ON public.achievements FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "certifications readable" ON public.certifications;
CREATE POLICY "certifications readable own or staff" ON public.certifications FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "learning readable" ON public.learning_records;
CREATE POLICY "learning readable own or staff" ON public.learning_records FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "recommendations readable" ON public.recommendations;
CREATE POLICY "recommendations readable own or staff" ON public.recommendations FOR SELECT TO authenticated
USING (public.owns_employee(employee_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "resumes update by owner" ON storage.objects;
CREATE POLICY "resumes update by owner" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
