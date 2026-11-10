-- Corrige o filtro de qualidade nas views: usa s.traffic_quality (sessão)
-- em vez de e.traffic_quality (evento). A sessão é a fonte de verdade —
-- alterações manuais em quiz_sessions.traffic_quality refletem corretamente.

drop index if exists public.idx_funnel_daily_pk;
drop index if exists public.idx_overview_daily_pk;
drop materialized view if exists public.quiz_step_funnel_daily;
drop materialized view if exists public.quiz_overview_daily;

-- ============================================================
-- 1. quiz_step_funnel_daily
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
where s.traffic_quality != 'bot'
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
-- 2. quiz_overview_daily
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
where s.traffic_quality != 'bot'
group by
  e.quiz_id,
  date_bucket,
  coalesce(s.utm_source, 'direct');

create unique index idx_overview_daily_pk
  on public.quiz_overview_daily (quiz_id, date_bucket, utm_source);
