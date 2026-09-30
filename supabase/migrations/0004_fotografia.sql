-- Novo tipo de projeto: fotografia (seção FOTOGRAFIA da home).
alter table public.projects drop constraint if exists projects_type_check;
alter table public.projects
  add constraint projects_type_check
  check (type in ('identidade-visual', 'branding', 'social-media', 'fotografia'));
