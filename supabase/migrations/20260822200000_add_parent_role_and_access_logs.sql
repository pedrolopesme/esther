-- ============================================================
-- Parent role + parent-children relationship + access logging
-- ============================================================

-- 1. Expand role constraint to include 'parent'
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'student', 'parent'));

-- 2. Parent ↔ child relationship
create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id),
  check (parent_id <> child_id)
);

create index parent_children_parent_idx on public.parent_children (parent_id);
create index parent_children_child_idx on public.parent_children (child_id);

alter table public.parent_children enable row level security;

-- Parents can manage their own links
create policy "Parents can read own child links"
  on public.parent_children for select
  using (parent_id = auth.uid());

create policy "Parents can add own child links"
  on public.parent_children for insert
  with check (parent_id = auth.uid());

create policy "Parents can remove own child links"
  on public.parent_children for delete
  using (parent_id = auth.uid());

-- 3. Access log — records every authenticated page visit by students
create table public.access_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  accessed_at timestamptz not null default now()
);

create index access_logs_user_time_idx
  on public.access_logs (user_id, accessed_at desc);

alter table public.access_logs enable row level security;

-- Students can insert their own logs
create policy "Students can log own access"
  on public.access_logs for insert
  with check (user_id = auth.uid());

-- Parents can read logs of their children
create policy "Parents can read children access logs"
  on public.access_logs for select
  using (
    exists (
      select 1 from public.parent_children
      where parent_id = auth.uid()
        and child_id = access_logs.user_id
    )
  );

-- Admins can read all logs
create policy "Admins can read all access logs"
  on public.access_logs for select
  using (public.is_admin());

-- 4. Update handle_new_user to accept 'parent' role from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if v_role not in ('admin', 'student', 'parent') then
    v_role := 'student';
  end if;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5. Helper: is_parent()
create or replace function public.is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'parent'
  );
$$;

-- 6. Helper: link a child by email (parent calls this)
create or replace function public.link_child(child_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_display_name text;
begin
  if not public.is_parent() then
    return jsonb_build_object('ok', false, 'error', 'Apenas responsáveis podem vincular filhos.');
  end if;

  select id, profiles.display_name
    into v_child_id, v_display_name
  from public.profiles
  where id in (
    select id from auth.users where email = child_email
  )
    and role = 'student'
  limit 1;

  if v_child_id is null then
    return jsonb_build_object('ok', false, 'error', 'Nenhum estudante encontrado com esse e-mail.');
  end if;

  insert into public.parent_children (parent_id, child_id)
  values (auth.uid(), v_child_id)
  on conflict (parent_id, child_id) do nothing;

  return jsonb_build_object('ok', true, 'child_id', v_child_id, 'display_name', v_display_name);
end;
$$;

grant execute on function public.link_child(text) to authenticated;
