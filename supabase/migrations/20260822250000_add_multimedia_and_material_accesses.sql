-- ============================================================
-- Migration: Media types, material accesses tracking & child events
-- ============================================================

-- 1. Expand bucket mime types to allow videos, audios, and all images (up to 200MB)
update storage.buckets
set
  file_size_limit = 209715200, -- 200MB
  allowed_mime_types = array[
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    -- Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    -- Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    -- Audios
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a'
  ]
where id = 'study-materials';

-- 2. Expand materials.category check constraint to include video, audio, imagem
alter table public.materials
  drop constraint if exists materials_category_check;

alter table public.materials
  add constraint materials_category_check
  check (category in ('apostila', 'resumo', 'livro', 'caderno', 'exercicios', 'prova', 'video', 'audio', 'imagem', 'outro'));

-- Add media_type helper column if not exists
alter table public.materials
  add column if not exists media_type text default 'document' check (media_type in ('document', 'video', 'audio', 'image', 'other'));

-- Update existing records to set media_type appropriately
update public.materials
set media_type = case
  when file_type like 'video/%' or category = 'video' then 'video'
  when file_type like 'audio/%' or category = 'audio' then 'audio'
  when file_type like 'image/%' or category = 'imagem' then 'image'
  else 'document'
end
where media_type is null or media_type = 'document';

-- 3. Create material_accesses table to record every view or download by child/user
create table if not exists public.material_accesses (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null check (action in ('view', 'download')),
  created_at timestamptz not null default now()
);

create index if not exists idx_material_accesses_child on public.material_accesses(child_id, created_at desc);
create index if not exists idx_material_accesses_material on public.material_accesses(material_id, created_at desc);
create index if not exists idx_material_accesses_user on public.material_accesses(user_id, created_at desc);

alter table public.material_accesses enable row level security;

-- Policies for material_accesses
drop policy if exists "Anyone can record material access" on public.material_accesses;
create policy "Anyone can record material access"
  on public.material_accesses for insert
  with check (child_id is not null or user_id is not null or auth.uid() is not null);

drop policy if exists "Users and children can read own material access" on public.material_accesses;
create policy "Users and children can read own material access"
  on public.material_accesses for select
  using (
    user_id = auth.uid()
    or child_id is not null
    or public.is_admin()
  );

drop policy if exists "Parents can read children material access" on public.material_accesses;
create policy "Parents can read children material access"
  on public.material_accesses for select
  using (
    exists (
      select 1 from public.children
      where children.id = material_accesses.child_id
        and children.parent_id = auth.uid()
    )
  );

-- 4. Update child_events constraint to allow 'material_viewed' and 'material_downloaded'
alter table public.child_events
  drop constraint if exists child_events_event_type_check;

alter table public.child_events
  add constraint child_events_event_type_check
  check (event_type in ('login', 'exercise_started', 'exercise_completed', 'material_viewed', 'material_downloaded'));
