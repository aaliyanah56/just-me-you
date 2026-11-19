-- URWA Department Management Tracker
-- Applied to live project kwqaorzvflrgepepfwwg on 2026-11-19.
-- Department access is independent of the user's student/teacher/admin portal role.

create table if not exists public.department_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  department_key text not null check (department_key in ('halaqa_management','finance','social_media','events')),
  access_level text not null default 'member' check (access_level in ('head','member')),
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (profile_id, department_key)
);
create table if not exists public.department_goals (
  id uuid primary key default gen_random_uuid(),
  department_key text not null check (department_key in ('halaqa_management','finance','social_media','events')),
  title text not null, description text, target_metric text, target_value numeric, unit text,
  start_date date, due_date date,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','on_hold')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.department_reports (
  id uuid primary key default gen_random_uuid(),
  department_key text not null check (department_key in ('halaqa_management','finance','social_media','events')),
  goal_id uuid references public.department_goals(id) on delete set null,
  report_type text not null default 'progress' check (report_type in ('progress','achievement','challenge','meeting')),
  title text not null, details text not null, progress_percent integer check (progress_percent between 0 and 100),
  evidence_url text, period_start date, period_end date,
  review_status text not null default 'submitted' check (review_status in ('submitted','reviewed','needs_revision')),
  submitted_by uuid not null references public.profiles(id),
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists department_memberships_profile_idx on public.department_memberships(profile_id);
create index if not exists department_goals_department_idx on public.department_goals(department_key,status);
create index if not exists department_reports_department_idx on public.department_reports(department_key,created_at desc);
create index if not exists department_reports_goal_idx on public.department_reports(goal_id);
alter table public.department_memberships enable row level security;
alter table public.department_goals enable row level security;
alter table public.department_reports enable row level security;
grant select,insert,update,delete on public.department_memberships,public.department_goals,public.department_reports to authenticated;
create policy "department members see own membership or admins" on public.department_memberships for select to authenticated using (profile_id=(select auth.uid()) or public.is_admin());
create policy "admins manage department memberships" on public.department_memberships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "department members read department goals" on public.department_goals for select to authenticated using (public.is_admin() or exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_goals.department_key));
create policy "department heads create goals" on public.department_goals for insert to authenticated with check (public.is_admin() or exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_goals.department_key and m.access_level='head'));
create policy "department heads update goals" on public.department_goals for update to authenticated using (public.is_admin() or exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_goals.department_key and m.access_level='head')) with check (public.is_admin() or exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_goals.department_key and m.access_level='head'));
create policy "admins delete department goals" on public.department_goals for delete to authenticated using (public.is_admin());
create policy "department members read department reports" on public.department_reports for select to authenticated using (public.is_admin() or exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_reports.department_key));
create policy "department members submit reports" on public.department_reports for insert to authenticated with check (submitted_by=(select auth.uid()) and exists(select 1 from public.department_memberships m where m.profile_id=(select auth.uid()) and m.department_key=department_reports.department_key));
create policy "admins review reports or submitters edit pending" on public.department_reports for update to authenticated using (public.is_admin() or (submitted_by=(select auth.uid()) and review_status='submitted')) with check (public.is_admin() or (submitted_by=(select auth.uid()) and review_status='submitted'));
create policy "admins delete department reports" on public.department_reports for delete to authenticated using (public.is_admin());
