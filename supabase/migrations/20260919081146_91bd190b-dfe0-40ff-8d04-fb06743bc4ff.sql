-- Only HR/admin may see who else holds elevated roles. A SECURITY DEFINER
-- helper is required here so the policy does not recurse into user_roles.
create or replace function public.is_staff_definer(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('hr', 'admin')
  )
$$;

revoke execute on function public.is_staff_definer(uuid) from public, anon;
grant execute on function public.is_staff_definer(uuid) to authenticated;

drop policy if exists "staff roles visible" on public.user_roles;

create policy "staff can view role assignments" on public.user_roles
  for select to authenticated
  using (public.is_staff_definer(auth.uid()));