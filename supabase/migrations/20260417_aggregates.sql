-- Etapa 8: Read model — views para alimentar o dashboard (PRD §9.1–§9.4)
-- Timezone fixo America/Sao_Paulo para todos os buckets.

-- ============================================================
-- 1. quiz_step_funnel_daily
--    Agrega métricas por step, por dia, por utm_source.
--    Dedup por sessão: cada sessão conta 1x por step (PRD §9.2).
-- ============================================================
create materialized view if not exists public.quiz_step_funnel_daily as
select
  e.quiz_id,
  (e.event_ts at time zone 'America/Sao_Paulo')::date as date_bucket,
  e.step_id,
  e.step_order,
  coalesce(s.utm_source, 'direct') as utm_source,

  count(distinct case when e.event_name = 'step_view'
    then e.session_id end) as unique_sessions_reached,

  count(distinct case when e.event_name = 'step_advance'
    then e.session_id end) as unique_sessions_advanced,

  count(distinct case when e.event_name = 'step_back'
    then e.session_id end) as unique_sessions_back,

  count(distinct case when e.event_name = 'quiz_complete_cta_click'
    then e.session_id end) as unique_final_clicks

from public.quiz_events e
join public.quiz_sessions s on s.id = e.session_id
where e.traffic_quality = 'human'
  and e.step_id is not null
group by
  e.quiz_id,
  date_bucket,
  e.step_id,
  e.step_order,
  coalesce(s.utm_source, 'direct');

create unique index if not exists idx_funnel_daily_pk
  on public.quiz_step_funnel_daily (quiz_id, date_bucket, step_id, utm_source);

-- ============================================================
-- 2. quiz_overview_daily
--    Visitas, starts e final clicks deduplicados por sessão/dia.
-- ============================================================
create materialized view if not exists public.quiz_overview_daily as
select
  e.quiz_id,
  (e.event_ts at time zone 'America/Sao_Paulo')::date as date_bucket,
  coalesce(s.utm_source, 'direct') as utm_source,

  count(distinct case when e.event_name = 'quiz_visit'
    then e.session_id end) as visits,

  count(distinct case when e.event_name = 'quiz_start'
    then e.session_id end) as starts,

  count(distinct case when e.event_name = 'quiz_complete_cta_click'
    then e.session_id end) as final_clicks

from public.quiz_events e
join public.quiz_sessions s on s.id = e.session_id
where e.traffic_quality = 'human'
group by
  e.quiz_id,
  date_bucket,
  coalesce(s.utm_source, 'direct');

create unique index if not exists idx_overview_daily_pk
  on public.quiz_overview_daily (quiz_id, date_bucket, utm_source);

-- ============================================================
-- 3. Função helper para refresh on-demand
-- ============================================================
create or replace function public.refresh_quiz_aggregates()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.quiz_step_funnel_daily;
  refresh materialized view concurrently public.quiz_overview_daily;
end;
$$;
