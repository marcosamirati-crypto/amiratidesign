-- ───────── Estatísticas anônimas do Elle ─────────
-- Uma linha por análise. NUNCA guarda o print, o texto lido, a resposta nem dados de quem enviou
-- (sem IP, sem identificador). Só o necessário para contar uso e acompanhar falhas.

create table if not exists public.elle_events (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  outcome           text not null check (outcome in ('ok', 'error', 'cancelled')),
  error_code        text check (char_length(error_code) <= 40),
  error_detail      text check (char_length(error_detail) <= 40),   -- ex.: "api 400 credit", "abort"
  primary_category  text check (primary_category in ('corrupcao', 'valores', 'liberdade', 'economia')),
  categories        text[] not null default '{}',
  reading           text check (reading in ('alta', 'media', 'baixa')),
  reply_recommended boolean,
  searches          smallint check (searches between 0 and 50),
  used_plans        boolean,
  duration_ms       integer check (duration_ms between 0 and 900000)
);

create index if not exists elle_events_created_idx on public.elle_events (created_at desc);

alter table public.elle_events enable row level security;

-- O servidor do site grava com a chave pública (anon). Ninguém de fora lê linha por linha.
drop policy if exists "elle_events_public_insert" on public.elle_events;
create policy "elle_events_public_insert" on public.elle_events
  for insert to anon, authenticated with check (true);

drop policy if exists "elle_events_admin_read" on public.elle_events;
create policy "elle_events_admin_read" on public.elle_events
  for select to authenticated using (true);

-- Números agregados para o painel. Só totais e contagens: nenhuma linha individual sai daqui.
create or replace function public.elle_stats(since_hours integer default 24)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with w as (
    select * from public.elle_events
    where created_at >= now() - make_interval(hours => least(greatest(since_hours, 1), 24 * 60))
  )
  select jsonb_build_object(
    'generated_at', now(),
    'since_hours', least(greatest(since_hours, 1), 24 * 60),
    'total', (select count(*) from w),
    'ok', (select count(*) from w where outcome = 'ok'),
    'error', (select count(*) from w where outcome = 'error'),
    'cancelled', (select count(*) from w where outcome = 'cancelled'),
    'avg_ok_ms', (select round(avg(duration_ms)) from w where outcome = 'ok'),
    'reply_recommended', (select count(*) from w where outcome = 'ok' and reply_recommended),
    'by_category', coalesce((
      select jsonb_object_agg(primary_category, n) from (
        select primary_category, count(*) n from w
        where outcome = 'ok' and primary_category is not null
        group by primary_category
      ) c), '{}'::jsonb),
    'by_error', coalesce((
      select jsonb_object_agg(k, n) from (
        select coalesce(error_code, '?') || coalesce(' · ' || error_detail, '') k, count(*) n
        from w where outcome = 'error' group by 1
      ) e), '{}'::jsonb),
    'by_hour', coalesce((
      select jsonb_agg(jsonb_build_object('hour', h, 'ok', ok, 'error', er) order by h) from (
        select date_trunc('hour', created_at) h,
               count(*) filter (where outcome = 'ok') ok,
               count(*) filter (where outcome = 'error') er
        from w group by 1
      ) t), '[]'::jsonb),
    'last_ok_at', (select max(created_at) from w where outcome = 'ok'),
    'last_error_at', (select max(created_at) from w where outcome = 'error')
  );
$$;

revoke all on function public.elle_stats(integer) from public;
grant execute on function public.elle_stats(integer) to anon, authenticated;
