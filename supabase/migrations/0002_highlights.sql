-- Capas/destaques dos posts (ex.: o "01" de cada carrossel), usados no mural de Social Media da home.
alter table public.projects
  add column if not exists highlights text[] not null default '{}';
