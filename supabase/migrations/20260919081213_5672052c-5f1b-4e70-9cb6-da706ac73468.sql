-- Role assignments are self-read only; staff listings are served by a
-- server function that verifies the caller is an admin.
drop policy if exists "staff can view role assignments" on public.user_roles;
drop function if exists public.is_staff_definer(uuid);