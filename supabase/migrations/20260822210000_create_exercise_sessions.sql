-- Track each exercise session for performance reporting
create table public.exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_subject text not null,
  list_slug text not null,
  list_title text not null,
  total_questions integer not null,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  wrong_details jsonb not null default '[]'::jsonb,
  points_earned integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer
);

create index idx_exercise_sessions_user on public.exercise_sessions(user_id, completed_at desc);
create index idx_exercise_sessions_subject on public.exercise_sessions(user_id, list_subject);

alter table public.exercise_sessions enable row level security;

-- Users can read their own sessions
create policy "Users can read own exercise sessions"
  on public.exercise_sessions for select
  using (user_id = auth.uid());

-- Users can insert their own sessions
create policy "Users can insert own exercise sessions"
  on public.exercise_sessions for insert
  with check (user_id = auth.uid());

-- Users can update their own sessions
create policy "Users can update own exercise sessions"
  on public.exercise_sessions for update
  using (user_id = auth.uid());

-- Admins can read all sessions
create policy "Admins can read all exercise sessions"
  on public.exercise_sessions for select
  using (public.is_admin());

-- View for quick analytics per student per subject
create or replace view public.exercise_stats as
select
  user_id,
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
group by user_id, list_subject;