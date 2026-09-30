-- Amirati Design — schema inicial
-- Rode no Supabase: SQL Editor > New query > cole este arquivo > Run.

create extension if not exists "pgcrypto";

-- ───────── Projetos ─────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  client       text,
  type         text not null default 'identidade-visual'
               check (type in ('identidade-visual', 'branding', 'social-media')),
  year         int,
  summary      text,
  external_url text,
  cover_url    text,
  images       text[] not null default '{}',
  published    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists projects_published_idx
  on public.projects (published, sort_order, year desc);

-- ───────── Mensagens do formulário de contato ─────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200),
  message    text not null check (char_length(message) between 1 and 4000),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- TODO (backlog): tabela `proposals` para o gerador de propostas comerciais.
-- Ver src/app/admin/(panel)/propostas/README.md

-- ───────── RLS ─────────
alter table public.projects enable row level security;
alter table public.messages enable row level security;

-- Público lê apenas projetos publicados
drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects
  for select to anon, authenticated
  using (published = true);

-- Admin (usuário autenticado) faz tudo.
-- IMPORTANTE: desative "Allow new users to sign up" em Authentication > Providers > Email
-- e crie o usuário do dono manualmente; assim "authenticated" == dono.
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all to authenticated using (true) with check (true);

-- Qualquer visitante pode enviar mensagem; só o admin lê/edita.
drop policy if exists "messages_public_insert" on public.messages;
create policy "messages_public_insert" on public.messages
  for insert to anon, authenticated with check (true);

drop policy if exists "messages_admin_all" on public.messages;
create policy "messages_admin_all" on public.messages
  for all to authenticated using (true) with check (true);

-- ───────── Storage (bucket público para imagens dos projetos) ─────────
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

drop policy if exists "projects_files_public_read" on storage.objects;
create policy "projects_files_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'projects');

drop policy if exists "projects_files_admin_write" on storage.objects;
create policy "projects_files_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'projects') with check (bucket_id = 'projects');
