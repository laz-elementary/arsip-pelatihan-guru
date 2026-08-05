-- Jalankan seluruh skrip ini sekali melalui Supabase > SQL Editor.
-- Aman dijalankan ulang karena menggunakan IF NOT EXISTS.

create extension if not exists pgcrypto;

create table if not exists public.trainings (
  id text primary key,
  teacher_id text not null,
  teacher_name text not null,
  teacher_role text,
  training_name text not null,
  organizer text,
  start_date date not null,
  end_date date,
  hours integer not null default 0,
  category text,
  location text,
  notes text,
  certificate_drive_url text,
  certificate_file_name text,
  material_drive_url text,
  material_file_name text,
  ai_summary text,
  ai_action_plan jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  drive_file_id text not null,
  web_view_link text not null,
  mime_type text,
  file_size bigint,
  file_type text check (file_type in ('certificate', 'material')),
  training_id text,
  upload_id text,
  created_at timestamptz not null default now()
);

-- Tambahkan kolom untuk project yang sebelumnya sudah memiliki tabel lama.
alter table public.training_files add column if not exists upload_id text;
alter table public.training_files add column if not exists training_id text;

-- Cegah metadata dan file tercatat dua kali.
drop index if exists public.training_files_upload_id_unique;
create unique index training_files_upload_id_unique
  on public.training_files (upload_id);

create unique index if not exists training_files_drive_file_id_unique
  on public.training_files (drive_file_id);

create index if not exists training_files_training_id_idx
  on public.training_files (training_id);

create index if not exists trainings_created_at_idx
  on public.trainings (created_at desc);

alter table public.trainings enable row level security;
alter table public.training_files enable row level security;

-- Aplikasi mengakses tabel melalui backend menggunakan service-role key.
-- Karena itu tidak diperlukan policy publik untuk INSERT/UPDATE/DELETE.
