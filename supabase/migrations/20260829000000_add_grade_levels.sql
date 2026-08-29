-- ============================================================
-- Grade levels table + FK on children + updated RPCs
-- ============================================================

-- 1. Create grade_levels table
create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage text not null,
  sort_order integer not null unique
);

alter table public.grade_levels enable row level security;

-- Everyone can read grade levels (they're a static lookup)
create policy "Anyone can read grade levels"
  on public.grade_levels for select
  using (true);

-- 2. Populate Brazilian education grade levels
insert into public.grade_levels (name, stage, sort_order) values
  ('Berçário',                    'Educação Infantil',      1),
  ('Maternal I',                  'Educação Infantil',      2),
  ('Maternal II',                 'Educação Infantil',      3),
  ('Jardim I',                    'Educação Infantil',      4),
  ('Jardim II',                   'Educação Infantil',      5),
  ('1º ano',                      'Ensino Fundamental I',   6),
  ('2º ano',                      'Ensino Fundamental I',   7),
  ('3º ano',                      'Ensino Fundamental I',   8),
  ('4º ano',                      'Ensino Fundamental I',   9),
  ('5º ano',                      'Ensino Fundamental I',  10),
  ('6º ano',                      'Ensino Fundamental II', 11),
  ('7º ano',                      'Ensino Fundamental II', 12),
  ('8º ano',                      'Ensino Fundamental II', 13),
  ('9º ano',                      'Ensino Fundamental II', 14),
  ('1ª série do Ensino Médio',    'Ensino Médio',          15),
  ('2ª série do Ensino Médio',    'Ensino Médio',          16),
  ('3ª série do Ensino Médio',    'Ensino Médio',          17);

-- 3. Add grade_level_id to children (nullable first)
alter table public.children add column if not exists grade_level_id uuid references public.grade_levels(id);

-- 4. Set existing children to "1º ano" (sort_order = 6)
update public.children
set grade_level_id = (select id from public.grade_levels where sort_order = 6)
where grade_level_id is null;

-- 5. Make the column NOT NULL
alter table public.children alter column grade_level_id set not null;

-- 6. Drop old register_child (3-param) and recreate with grade_level_id
drop function if exists public.register_child(text, text, text);

create or replace function public.register_child(
  p_display_name text,
  p_username text,
  p_password text,
  p_grade_level_id uuid
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

  if not exists (select 1 from public.grade_levels where id = p_grade_level_id) then
    return jsonb_build_object('ok', false, 'error', 'Série inválida.');
  end if;

  insert into public.children (parent_id, display_name, username, password_hash, grade_level_id)
  values (auth.uid(), p_display_name, lower(p_username), extensions.crypt(p_password, extensions.gen_salt('bf')), p_grade_level_id)
  returning id into v_child_id;

  return jsonb_build_object('ok', true, 'child_id', v_child_id, 'display_name', p_display_name, 'username', lower(p_username));
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Este nome de usuário já está em uso.');
end;
$$;

grant execute on function public.register_child(text, text, text, uuid) to authenticated;

-- 7. Update child_login to return grade_level info
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
  select c.id, c.display_name, c.parent_id, c.active, c.grade_level_id, g.name as grade_level_name, g.stage as grade_level_stage
  into v_child
  from public.children c
  left join public.grade_levels g on g.id = c.grade_level_id
  where c.username = lower(p_username)
    and c.password_hash = extensions.crypt(p_password, c.password_hash);

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Usuário ou senha incorretos.');
  end if;

  if not v_child.active then
    return jsonb_build_object('ok', false, 'error', 'Esta conta de estudante está desativada. Peça ao seu responsável para reativá-la.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'child_id', v_child.id,
    'display_name', v_child.display_name,
    'parent_id', v_child.parent_id,
    'grade_level_id', v_child.grade_level_id,
    'grade_level_name', v_child.grade_level_name,
    'grade_level_stage', v_child.grade_level_stage
  );
end;
$$;