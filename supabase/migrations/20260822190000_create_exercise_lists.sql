create table public.exercise_lists (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  subject text not null check (subject in ('matematica', 'portugues', 'ingles', 'geografia', 'historia', 'ciencias')),
  materia text not null,
  ano_letivo text,
  exercise_date date not null,
  exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises) = 'array'),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject, slug)
);

create index exercise_lists_public_listing_idx
  on public.exercise_lists (published, exercise_date desc);

create index exercise_lists_subject_listing_idx
  on public.exercise_lists (subject, published, exercise_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exercise_lists_set_updated_at
before update on public.exercise_lists
for each row execute function public.set_updated_at();

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (select 1 from public.admin_users) then
    return false;
  end if;

  insert into public.admin_users (user_id) values (auth.uid());
  return true;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;

alter table public.exercise_lists enable row level security;
alter table public.admin_users enable row level security;

create policy "Anyone can read published exercise lists"
  on public.exercise_lists for select
  using (published = true or public.is_admin());

create policy "Admins can create exercise lists"
  on public.exercise_lists for insert
  with check (public.is_admin());

create policy "Admins can update exercise lists"
  on public.exercise_lists for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete exercise lists"
  on public.exercise_lists for delete
  using (public.is_admin());

create policy "Users can verify their own admin membership"
  on public.admin_users for select
  using (user_id = auth.uid());
