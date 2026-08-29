-- ============================================================
-- update_child RPC: parent edits child name / password / grade
-- ============================================================

create or replace function public.update_child(
  p_child_id uuid,
  p_display_name text default null,
  p_password text default null,
  p_grade_level_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner_id uuid;
begin
  if not public.is_parent() then
    return jsonb_build_object('ok', false, 'error', 'Apenas responsáveis podem editar filhos.');
  end if;

  select parent_id into v_owner_id
  from public.children
  where id = p_child_id;

  if v_owner_id is null then
    return jsonb_build_object('ok', false, 'error', 'Criança não encontrada.');
  end if;

  if v_owner_id != auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Você não pode editar esta criança.');
  end if;

  if p_display_name is not null and length(trim(p_display_name)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'O nome não pode ficar vazio.');
  end if;

  if p_password is not null and length(p_password) < 6 then
    return jsonb_build_object('ok', false, 'error', 'A senha precisa ter pelo menos 6 caracteres.');
  end if;

  if p_grade_level_id is not null and not exists (
    select 1 from public.grade_levels where id = p_grade_level_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'Série inválida.');
  end if;

  update public.children set
    display_name = coalesce(p_display_name, display_name),
    password_hash = case
      when p_password is not null then extensions.crypt(p_password, extensions.gen_salt('bf'))
      else password_hash
    end,
    grade_level_id = coalesce(p_grade_level_id, grade_level_id)
  where id = p_child_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.update_child(uuid, text, text, uuid) to authenticated;