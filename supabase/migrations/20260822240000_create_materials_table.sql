-- ============================================================
-- Migration: Create 'materials' table and storage bucket
-- ============================================================

-- 1. Create public storage bucket for study materials
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  true,
  52428800, -- 50MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies for study-materials bucket
drop policy if exists "Anyone can read study materials" on storage.objects;
create policy "Anyone can read study materials"
  on storage.objects for select
  using (bucket_id = 'study-materials');

drop policy if exists "Admins can upload study materials" on storage.objects;
create policy "Admins can upload study materials"
  on storage.objects for insert
  with check (bucket_id = 'study-materials' and public.is_admin());

drop policy if exists "Admins can update study materials" on storage.objects;
create policy "Admins can update study materials"
  on storage.objects for update
  using (bucket_id = 'study-materials' and public.is_admin())
  with check (bucket_id = 'study-materials' and public.is_admin());

drop policy if exists "Admins can delete study materials" on storage.objects;
create policy "Admins can delete study materials"
  on storage.objects for delete
  using (bucket_id = 'study-materials' and public.is_admin());

-- 2. Create public.materials table
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  subject_id text not null references public.subjects(id) on update cascade on delete restrict,
  ano_letivo text default '3º ano do Ensino Fundamental',
  file_url text not null,
  file_name text not null,
  file_size bigint not null default 0,
  file_type text not null default 'application/pdf',
  category text not null default 'apostila' check (category in ('apostila', 'resumo', 'livro', 'caderno', 'exercicios', 'prova', 'outro')),
  published boolean not null default true,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for materials updated_at
drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists idx_materials_subject on public.materials(subject_id, published, created_at desc);
create index if not exists idx_materials_category on public.materials(category);
create index if not exists idx_materials_published on public.materials(published, created_at desc);

-- 3. Enable RLS on materials
alter table public.materials enable row level security;

-- RLS Policies
drop policy if exists "Anyone can read published materials" on public.materials;
create policy "Anyone can read published materials"
  on public.materials for select
  using (published = true or public.is_admin());

drop policy if exists "Admins can insert materials" on public.materials;
create policy "Admins can insert materials"
  on public.materials for insert
  with check (public.is_admin());

drop policy if exists "Admins can update materials" on public.materials;
create policy "Admins can update materials"
  on public.materials for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete materials" on public.materials;
create policy "Admins can delete materials"
  on public.materials for delete
  using (public.is_admin());
