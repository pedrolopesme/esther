-- ============================================================
-- Migration: Create 'subjects' table & link with 'exercise_lists'
-- ============================================================

-- 1. Create subjects table
create table if not exists public.subjects (
  id text primary key, -- slug/id e.g. 'matematica', 'portugues', 'ciencias'
  name text not null,  -- display name e.g. 'Matemática'
  emoji text not null default '📚',
  icon text not null default 'BookOpenText',
  color text not null default 'lilac',
  hex text not null default '#A370FF',
  gradient text not null default 'from-[#A370FF] to-[#C4A3FF]',
  soft text not null default 'from-[#EEE6FF] to-[#F6F0FF]',
  tag text not null default '',
  order_index integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for subjects updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

-- 2. Seed initial canonical subjects
insert into public.subjects (id, name, emoji, icon, color, hex, gradient, soft, tag, order_index)
values
  ('matematica', 'Matemática', '🔢', 'Calculator', 'candy', '#FF70A6', 'from-[#FF70A6] to-[#FF9AC5]', 'from-[#FFE3F0] to-[#FFF0F7]', 'Números & lógica', 1),
  ('portugues', 'Português', '📚', 'BookOpenText', 'lilac', '#A370FF', 'from-[#A370FF] to-[#C4A3FF]', 'from-[#EEE6FF] to-[#F6F0FF]', 'Leitura & escrita', 2),
  ('ingles', 'Inglês', '🇺🇸', 'Languages', 'sky', '#4CC9F0', 'from-[#4CC9F0] to-[#8BDDF6]', 'from-[#E1F6FD] to-[#F0FBFE]', 'Words & grammar', 3),
  ('geografia', 'Geografia', '🌍', 'Globe2', 'mint', '#06D6A0', 'from-[#06D6A0] to-[#5FE6C4]', 'from-[#DBF9F1] to-[#EEFCF8]', 'Mundo & lugares', 4),
  ('historia', 'História', '📜', 'Landmark', 'sun', '#FFD166', 'from-[#FFC13B] to-[#FFDD8A]', 'from-[#FFF3D6] to-[#FFF9EC]', 'Tempo & memória', 5),
  ('ciencias', 'Ciências', '🔬', 'Microscope', 'coral', '#FF9770', 'from-[#FF9770] to-[#FFB89B]', 'from-[#FFE9E0] to-[#FFF4EF]', 'Vida & natureza', 6)
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  icon = excluded.icon,
  color = excluded.color,
  hex = excluded.hex,
  gradient = excluded.gradient,
  soft = excluded.soft,
  tag = excluded.tag,
  order_index = excluded.order_index;

-- 3. Update exercise_lists: drop strict check constraint if present and add foreign key
alter table public.exercise_lists
  drop constraint if exists exercise_lists_subject_check;

-- Ensure any existing subjects in exercise_lists exist in subjects table
insert into public.subjects (id, name, emoji, icon, color, hex, gradient, soft, tag)
select distinct
  el.subject,
  coalesce(nullif(el.materia, ''), initcap(el.subject)),
  '📚',
  'BookOpenText',
  'lilac',
  '#A370FF',
  'from-[#A370FF] to-[#C4A3FF]',
  'from-[#EEE6FF] to-[#F6F0FF]',
  'Estudo'
from public.exercise_lists el
where el.subject is not null
  and not exists (select 1 from public.subjects s where s.id = el.subject)
on conflict (id) do nothing;

-- Add foreign key constraint
alter table public.exercise_lists
  drop constraint if exists exercise_lists_subject_fkey;

alter table public.exercise_lists
  add constraint exercise_lists_subject_fkey
  foreign key (subject) references public.subjects(id)
  on update cascade
  on delete restrict;

-- 4. Enable RLS on subjects
alter table public.subjects enable row level security;

-- Policies for subjects
drop policy if exists "Anyone can read active subjects" on public.subjects;
create policy "Anyone can read active subjects"
  on public.subjects for select
  using (active = true or public.is_admin());

drop policy if exists "Admins can insert subjects" on public.subjects;
create policy "Admins can insert subjects"
  on public.subjects for insert
  with check (public.is_admin());

drop policy if exists "Admins can update subjects" on public.subjects;
create policy "Admins can update subjects"
  on public.subjects for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete subjects" on public.subjects;
create policy "Admins can delete subjects"
  on public.subjects for delete
  using (public.is_admin());
