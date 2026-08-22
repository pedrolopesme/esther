-- ============================================================
-- Structured Child Activity Events Table
-- ============================================================

create table if not exists public.child_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  event_type text not null check (event_type in ('login', 'exercise_started', 'exercise_completed')),
  subject text,
  list_slug text,
  list_title text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_child_events_child_date on public.child_events (child_id, created_at desc);
create index if not exists idx_child_events_type on public.child_events (child_id, event_type);

alter table public.child_events enable row level security;

-- Parents can read events of their own children
drop policy if exists "Parents can read children events" on public.child_events;
create policy "Parents can read children events"
  on public.child_events for select
  using (
    exists (
      select 1 from public.children
      where children.id = child_events.child_id
        and children.parent_id = auth.uid()
    )
  );

-- Children or anon client can insert child events
drop policy if exists "Anyone can insert child events" on public.child_events;
create policy "Anyone can insert child events"
  on public.child_events for insert
  with check (child_id is not null);

-- Parents can also read their children's exercise_sessions
drop policy if exists "Parents can read children exercise sessions" on public.exercise_sessions;
create policy "Parents can read children exercise sessions"
  on public.exercise_sessions for select
  using (
    (user_id = auth.uid())
    or (
      child_id is not null and exists (
        select 1 from public.children
        where children.id = exercise_sessions.child_id
          and children.parent_id = auth.uid()
      )
    )
  );
