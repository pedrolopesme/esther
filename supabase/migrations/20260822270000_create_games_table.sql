-- ============================================================
-- Migration: Games, Game Sessions & Storage Bucket
-- ============================================================

-- 1. Create or ensure games storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'games',
  'games',
  true,
  52428800, -- 50MB max per single-file html
  array[
    'text/html',
    'application/xhtml+xml',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies for games bucket
drop policy if exists "Anyone can read games" on storage.objects;
create policy "Anyone can read games"
  on storage.objects for select
  using (bucket_id = 'games');

drop policy if exists "Admins can upload games" on storage.objects;
create policy "Admins can upload games"
  on storage.objects for insert
  with check (bucket_id = 'games' and public.is_admin());

drop policy if exists "Admins can update games" on storage.objects;
create policy "Admins can update games"
  on storage.objects for update
  using (bucket_id = 'games' and public.is_admin())
  with check (bucket_id = 'games' and public.is_admin());

drop policy if exists "Admins can delete games" on storage.objects;
create policy "Admins can delete games"
  on storage.objects for delete
  using (bucket_id = 'games' and public.is_admin());

-- Also ensure study-materials bucket accepts text/html if uploaded there
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'text/html')
where id = 'study-materials' and not ('text/html' = any(allowed_mime_types));

-- 2. Create games table
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text default '',
  subject_id text not null references public.subjects(id) on update cascade on delete restrict,
  ano_letivo text default '4º ano',
  target_age integer default 9,
  version text default '1.0.0',
  max_score integer default 100,
  cover_url text, -- Base64 data URI or public storage URL
  file_url text not null,
  file_name text not null,
  file_size bigint not null default 0,
  metadata jsonb default '{}'::jsonb,
  published boolean not null default true,
  play_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for games updated_at
drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

-- Indexes for games
create index if not exists idx_games_subject on public.games(subject_id, published, created_at desc);
create index if not exists idx_games_published on public.games(published, created_at desc);

-- 3. Create game_sessions table for capturing child score & performance
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  game_title text not null,
  subject_id text not null,
  score integer not null default 0,
  max_score integer not null default 100,
  score_pct numeric not null default 0,
  time_spent_seconds integer default 0,
  details jsonb default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz default now()
);

create index if not exists idx_game_sessions_child on public.game_sessions(child_id, completed_at desc);
create index if not exists idx_game_sessions_game on public.game_sessions(game_id, completed_at desc);
create index if not exists idx_game_sessions_user on public.game_sessions(user_id, completed_at desc);

-- 4. Enable RLS
alter table public.games enable row level security;
alter table public.game_sessions enable row level security;

-- Policies for games
drop policy if exists "Anyone can read published games" on public.games;
create policy "Anyone can read published games"
  on public.games for select
  using (published = true or public.is_admin());

drop policy if exists "Admins can insert games" on public.games;
create policy "Admins can insert games"
  on public.games for insert
  with check (public.is_admin());

drop policy if exists "Admins can update games" on public.games;
create policy "Admins can update games"
  on public.games for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete games" on public.games;
create policy "Admins can delete games"
  on public.games for delete
  using (public.is_admin());

-- Policies for game_sessions
drop policy if exists "Anyone can record game session" on public.game_sessions;
create policy "Anyone can record game session"
  on public.game_sessions for insert
  with check (child_id is not null or user_id is not null or auth.uid() is not null);

drop policy if exists "Users and children can read own game sessions" on public.game_sessions;
create policy "Users and children can read own game sessions"
  on public.game_sessions for select
  using (
    user_id = auth.uid()
    or child_id is not null
    or public.is_admin()
  );

drop policy if exists "Parents can read children game sessions" on public.game_sessions;
create policy "Parents can read children game sessions"
  on public.game_sessions for select
  using (
    exists (
      select 1 from public.children
      where children.id = game_sessions.child_id
        and children.parent_id = auth.uid()
    )
  );

-- 5. Expand child_events event_type constraint to allow 'game_started' and 'game_completed'
alter table public.child_events
  drop constraint if exists child_events_event_type_check;

alter table public.child_events
  add constraint child_events_event_type_check
  check (event_type in (
    'login',
    'exercise_started',
    'exercise_completed',
    'material_viewed',
    'material_downloaded',
    'game_started',
    'game_completed'
  ));
