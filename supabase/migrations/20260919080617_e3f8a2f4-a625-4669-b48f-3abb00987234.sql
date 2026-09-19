create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  target_type text not null check (target_type in ('capability','role','learning','roadmap','chat')),
  target_label text not null,
  rating smallint not null check (rating in (-1, 1)),
  comment text,
  created_at timestamptz not null default now(),
  unique (employee_id, target_type, target_label)
);

grant select, insert, update, delete on public.recommendation_feedback to authenticated;
grant all on public.recommendation_feedback to service_role;

alter table public.recommendation_feedback enable row level security;

create policy "own or staff read feedback" on public.recommendation_feedback
  for select to authenticated
  using (public.owns_employee(employee_id) or public.is_staff(auth.uid()));

create policy "own insert feedback" on public.recommendation_feedback
  for insert to authenticated
  with check (public.owns_employee(employee_id));

create policy "own update feedback" on public.recommendation_feedback
  for update to authenticated
  using (public.owns_employee(employee_id))
  with check (public.owns_employee(employee_id));

create policy "own delete feedback" on public.recommendation_feedback
  for delete to authenticated
  using (public.owns_employee(employee_id));

create index recommendation_feedback_employee_idx on public.recommendation_feedback (employee_id);