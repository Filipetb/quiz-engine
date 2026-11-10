-- Etapa 6: schema inicial — quizzes, quiz_sessions, quiz_events
-- Referência: PRD §13, docs/IMPLEMENTATION_PLAN.md Etapa 6

-- ============================================================
-- 1. quizzes
-- ============================================================
create table public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  version     integer not null default 1,
  schema_json jsonb not null,
  status      text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quizzes_slug on public.quizzes (slug);

-- ============================================================
-- 2. quiz_sessions
-- ============================================================
create table public.quiz_sessions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes(id),
  session_token   text not null,
  utm_source      text,
  origin          text,
  device_type     text,
  country         text,
  traffic_quality text not null default 'human' check (traffic_quality in ('human', 'suspect', 'bot')),
  is_started      boolean not null default false,
  is_completed    boolean not null default false,
  current_step_id text,
  started_at      timestamptz,
  last_seen_at    timestamptz not null default now(),
  resumed_at      timestamptz,
  expires_at      timestamptz not null default (now() + interval '24 hours'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_sessions_quiz_token on public.quiz_sessions (quiz_id, session_token);
create index idx_sessions_quiz_id on public.quiz_sessions (quiz_id);

-- ============================================================
-- 3. quiz_events
-- ============================================================
create table public.quiz_events (
  id               uuid primary key default gen_random_uuid(),
  quiz_id          uuid not null references public.quizzes(id),
  session_id       uuid not null references public.quiz_sessions(id),
  event_name       text not null,
  step_id          text,
  step_order       integer,
  event_ts         timestamptz not null default now(),
  payload          jsonb,
  utm_source       text,
  origin           text,
  device_type      text,
  country          text,
  traffic_quality  text not null default 'human',
  idempotency_key  text
);

create unique index idx_events_idempotency
  on public.quiz_events (session_id, idempotency_key)
  where idempotency_key is not null;

create index idx_events_quiz_ts on public.quiz_events (quiz_id, event_ts);
create index idx_events_session on public.quiz_events (session_id);
create index idx_events_name_ts on public.quiz_events (event_name, event_ts);
