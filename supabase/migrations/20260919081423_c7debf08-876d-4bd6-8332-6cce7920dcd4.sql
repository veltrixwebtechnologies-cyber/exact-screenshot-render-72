-- Shared reference data: only HR/admin may add skills through the API.
-- Automated GitHub analysis writes skills server-side with elevated rights.
drop policy if exists "skills insert" on public.skills;

create policy "staff insert skills" on public.skills
  for insert to authenticated
  with check (public.is_staff(auth.uid()));