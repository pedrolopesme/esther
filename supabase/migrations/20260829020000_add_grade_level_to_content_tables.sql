-- ============================================================
-- Add grade_level_id to exercise_lists, materials, games
-- ============================================================

-- 1. exercise_lists
alter table public.exercise_lists
  add column if not exists grade_level_id uuid references public.grade_levels(id);

update public.exercise_lists
set grade_level_id = (select id from public.grade_levels where sort_order = 6)
where grade_level_id is null;

alter table public.exercise_lists alter column grade_level_id set not null;

-- 2. materials
alter table public.materials
  add column if not exists grade_level_id uuid references public.grade_levels(id);

update public.materials
set grade_level_id = (select id from public.grade_levels where sort_order = 6)
where grade_level_id is null;

alter table public.materials alter column grade_level_id set not null;

-- 3. games
alter table public.games
  add column if not exists grade_level_id uuid references public.grade_levels(id);

update public.games
set grade_level_id = (select id from public.grade_levels where sort_order = 6)
where grade_level_id is null;

alter table public.games alter column grade_level_id set not null;

-- 4. Indexes for filtering by grade level
create index if not exists idx_exercise_lists_grade on public.exercise_lists(grade_level_id);
create index if not exists idx_materials_grade on public.materials(grade_level_id);
create index if not exists idx_games_grade on public.games(grade_level_id);