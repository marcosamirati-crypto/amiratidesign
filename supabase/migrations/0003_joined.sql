-- Posts em 'trinca': imagens destacadas que aparecem coladas ao destaque anterior (efeito de continuidade).
alter table public.projects
  add column if not exists joined text[] not null default '{}';
