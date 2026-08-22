-- Add active column to children table for disabling instead of deleting
alter table public.children add column if not exists active boolean not null default true;

-- Update child_login to check if child is active
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
  select id, display_name, parent_id, active
  into v_child
  from public.children
  where username = lower(p_username)
    and password_hash = extensions.crypt(p_password, password_hash);

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
    'parent_id', v_child.parent_id
  );
end;
$$;
