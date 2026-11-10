-- Inclui tráfego 'suspect' nas views de métricas (apenas 'bot' é excluído).
-- Recria as views materializadas e adiciona função de breakdown por qualidade.

-- ============================================================
-- Drop views antigas (e seus indexes)
-- ============================================================
drop index if exists public.idx_funnel_daily_pk;
drop index if exists public.idx_overview_daily_pk;
drop materialized view if exists public.quiz_step_funnel_daily;
drop materialized view if exists public.quiz_overview_daily;

-- ============================================================
-- 1. quiz_step_funnel_daily (exclui apenas bot)
-- ============================================================
create materialized view public.quiz_step_funnel_daily as
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
where e.traffic_quality != 'bot'
  and e.step_id is not null
group by
  e.quiz_id,
  date_bucket,
  e.step_id,
  e.step_order,
  coalesce(s.utm_source, 'direct');

create unique index idx_funnel_daily_pk
  on public.quiz_step_funnel_daily (quiz_id, date_bucket, step_id, utm_source);

-- ============================================================
-- 2. quiz_overview_daily (exclui apenas bot)
-- ============================================================
create materialized view public.quiz_overview_daily as
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
where e.traffic_quality != 'bot'
group by
  e.quiz_id,
  date_bucket,
  coalesce(s.utm_source, 'direct');

create unique index idx_overview_daily_pk
  on public.quiz_overview_daily (quiz_id, date_bucket, utm_source);

-- ============================================================
-- 3. Breakdown de qualidade de tráfego por período
-- ============================================================
create or replace function public.get_traffic_quality_breakdown(
  p_quiz_id uuid,
  p_date_from date,
  p_date_to date
)
returns table(traffic_quality text, session_count bigint)
language sql
security definer
as $$
  select
    s.traffic_quality,
    count(distinct s.id)::bigint as session_count
  from public.quiz_sessions s
  join public.quiz_events e on e.session_id = s.id
  where e.quiz_id = p_quiz_id
    and (e.event_ts at time zone 'America/Sao_Paulo')::date
        between p_date_from and p_date_to
  group by s.traffic_quality;
$$;
