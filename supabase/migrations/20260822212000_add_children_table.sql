-- ============================================================
-- Children table (non-auth.users child profiles)
-- ============================================================

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index children_parent_idx on public.children (parent_id);
create index children_username_idx on public.children (username);

alter table public.children enable row level security;

-- Parents manage their own children
create policy "Parents can manage own children"
  on public.children for all
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- ============================================================
-- register_child RPC (called by parent)
-- ============================================================
create or replace function public.register_child(
  p_display_name text,
  p_username text,
  p_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_child_id uuid;
begin
  if not public.is_parent() then
    return jsonb_build_object('ok', false, 'error', 'Apenas responsáveis podem cadastrar filhos.');
  end if;

  if length(p_username) < 3 or length(p_username) > 30 or p_username !~ '^[a-z0-9_]+$' then
    return jsonb_build_object('ok', false, 'error', 'Usuário inválido (3–30 caracteres: letras, números e _).');
  end if;

  if length(p_password) < 6 then
    return jsonb_build_object('ok', false, 'error', 'A senha precisa ter pelo menos 6 caracteres.');
  end if;

  insert into public.children (parent_id, display_name, username, password_hash)
  values (auth.uid(), p_display_name, lower(p_username), extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning id into v_child_id;

  return jsonb_build_object('ok', true, 'child_id', v_child_id, 'display_name', p_display_name, 'username', lower(p_username));
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Este nome de usuário já está em uso.');
end;
$$;

grant execute on function public.register_child(text, text, text) to authenticated;

-- ============================================================
-- child_login RPC (called by child at login)
-- ============================================================
create or replace function public.child_login(
  p_username text,
  p_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_child record;
begin
  select id, display_name, parent_id
  into v_child
  from public.children
  where username = lower(p_username)
    and password_hash = extensions.crypt(p_password, password_hash);

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Usuário ou senha incorretos.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'child_id', v_child.id,
    'display_name', v_child.display_name,
    'parent_id', v_child.parent_id
  );
end;
$$;

grant execute on function public.child_login(text, text) to anon, authenticated;

-- ============================================================
-- Update access_logs to support children
-- ============================================================
alter table public.access_logs add column if not exists child_id uuid references public.children(id) on delete cascade;
alter table public.access_logs alter column user_id drop not null;

drop policy if exists "Parents can read children access logs" on public.access_logs;
create policy "Parents can read children access logs"
  on public.access_logs for select
  using (
    exists (
      select 1 from public.children
      where children.id = access_logs.child_id
        and children.parent_id = auth.uid()
    )
  );

drop policy if exists "Children can log own access" on public.access_logs;
create policy "Authenticated users log own access"
  on public.access_logs for insert
  with check (user_id = auth.uid());

create policy "Anyone can log child access"
  on public.access_logs for insert
  with check (child_id is not null);

-- Also keep parents' own access logs
drop policy if exists "Parents can read own access logs" on public.access_logs;
create policy "Users can read own access logs"
  on public.access_logs for select
  using (user_id = auth.uid());