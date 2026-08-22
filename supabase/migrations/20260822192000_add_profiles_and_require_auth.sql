-- Profiles table with roles

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('admin', 'student')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Migrate existing admins from admin_users to profiles
insert into public.profiles (id, role, display_name)
select user_id, 'admin', null
from public.admin_users
on conflict (id) do update set role = 'admin';

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Auto-create student profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'student',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Update is_admin to use profiles
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Update claim_first_admin to use profiles
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

  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;

  insert into public.profiles (id, role, display_name)
  values (auth.uid(), 'admin', null)
  on conflict (id) do update set role = 'admin';
  return true;
end;
$$;

-- Require authentication to read published exercise lists
-- (admins can read everything regardless of published state)
drop policy if exists "Anyone can read published exercise lists" on public.exercise_lists;

create policy "Authenticated users can read published exercise lists"
  on public.exercise_lists for select
  using ((published = true and auth.uid() is not null) or public.is_admin());
