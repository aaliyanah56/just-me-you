-- URWA AI Admissions Assistant
-- New public sign-ups remain pending until the server-side AI assessment runs.
create table if not exists public.admission_ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('approved','flagged','error')),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists admission_ai_reviews_user_created_idx
  on public.admission_ai_reviews(user_id, created_at desc);
alter table public.admission_ai_reviews enable row level security;
drop policy if exists "admins read AI admission reviews" on public.admission_ai_reviews;
create policy "admins read AI admission reviews"
  on public.admission_ai_reviews for select to authenticated
  using (public.is_admin());

create or replace function public.handle_new_urwa_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email, nullif(new.raw_user_meta_data ->> 'phone', ''),
    'student'::public.urwa_role, 'pending'::public.account_status)
  on conflict (id) do nothing;
  return new;
end;
$$;
