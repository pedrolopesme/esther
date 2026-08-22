-- 1. Allow anyone (including anonymous / child sessions) to read published exercise lists
drop policy if exists "Authenticated users can read published exercise lists" on public.exercise_lists;
drop policy if exists "Anyone can read published exercise lists" on public.exercise_lists;

create policy "Anyone can read published exercise lists"
  on public.exercise_lists for select
  using (published = true or public.is_admin());

-- 2. Update exercise_sessions to support child_id
alter table public.exercise_sessions add column if not exists child_id uuid references public.children(id) on delete cascade;
alter table public.exercise_sessions alter column user_id drop not null;

-- Update RLS on exercise_sessions
drop policy if exists "Users can insert own exercise sessions" on public.exercise_sessions;
drop policy if exists "Authenticated users insert own sessions" on public.exercise_sessions;
drop policy if exists "Children can insert own exercise sessions" on public.exercise_sessions;

create policy "Authenticated users insert own sessions"
  on public.exercise_sessions for insert
  with check (user_id = auth.uid());

create policy "Children can insert own exercise sessions"
  on public.exercise_sessions for insert
  with check (child_id is not null);

drop policy if exists "Users can read own exercise sessions" on public.exercise_sessions;
create policy "Users can read own exercise sessions"
  on public.exercise_sessions for select
  using (
    (user_id is not null and user_id = auth.uid())
    or (
      child_id is not null and exists (
        select 1 from public.children
        where children.id = exercise_sessions.child_id
          and children.parent_id = auth.uid()
      )
    )
  );

-- Drop and recreate exercise_stats view to support child_id cleanly
drop view if exists public.exercise_stats;
create view public.exercise_stats as
select
  coalesce(user_id, child_id) as student_id,
  user_id,
  child_id,
  list_subject,
  count(*) as total_sessions,
  sum(correct_count) as total_correct,
  sum(wrong_count) as total_wrong,
  sum(total_questions) as total_questions,
  round(avg(case when total_questions > 0 then correct_count::numeric / total_questions * 100 else 0 end), 1) as avg_score_pct,
  sum(points_earned) as total_points,
  sum(duration_seconds) filter (where duration_seconds is not null) as total_time_seconds,
  max(completed_at) as last_practice
from public.exercise_sessions
where completed_at is not null
group by user_id, child_id, list_subject;
