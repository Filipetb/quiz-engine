-- Etapa 6: RLS policies
-- Regra: anon nunca escreve. Escrita via service role (edge functions).
-- Leitura: authenticated pode ler (dashboard, Etapa 9).

-- ============================================================
-- Enable RLS
-- ============================================================
alter table public.quizzes enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_events enable row level security;

-- ============================================================
-- quizzes
-- ============================================================
create policy "quizzes_read_authenticated"
  on public.quizzes for select
  to authenticated
  using (true);

create policy "quizzes_read_anon"
  on public.quizzes for select
  to anon
  using (status = 'active');

-- ============================================================
-- quiz_sessions — read only for authenticated
-- ============================================================
create policy "sessions_read_authenticated"
  on public.quiz_sessions for select
  to authenticated
  using (true);

-- ============================================================
-- quiz_events — read only for authenticated
-- ============================================================
create policy "events_read_authenticated"
  on public.quiz_events for select
  to authenticated
  using (true);
