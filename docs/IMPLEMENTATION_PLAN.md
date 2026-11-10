# Plano de Execução — QuizEngine (Runtime + Dashboard Analytics)

> Plano aprovado em **2026-04-14**. Referência: [`PRD.md`](../PRD.md).
> Ao executar cada etapa, paramos no final pra validar antes de seguir.

---

## Context

O projeto está em estado **scaffold puro**: só existe `PRD.md`, `supabase/config.toml`, e a gravação `gravação de tela do quiz de referência (.mov)` (28 MB). Não há `package.json`, `src/`, migrations, nem commit inicial.

**Objetivo**: construir em etapas incrementais a v1 do QuizEngine conforme PRD — runtime de quiz por schema + pipeline de analytics próprio + dashboard interno de CRO — começando pelo clone fiel do quiz de referência (treino em casa).

**Decisões confirmadas**:
- Build tool: **Vite + React Router** (SPA)
- UI: **Tailwind + shadcn/ui**
- Supabase: **local por enquanto** (`supabase start`), provisionar Cloud só na Etapa 10
- Primeira entrega de valor: **Runtime + clone visual**, analytics/dashboard depois

**Defaults técnicos adotados**:
- Package manager: `pnpm`
- State: `zustand` (sessão/variáveis)
- Schema validation: `zod`
- Forms: `react-hook-form` + `zodResolver`
- Charts (dashboard): `recharts`
- Ícones: `lucide-react`
- Datas/timezone: `date-fns` + `date-fns-tz` (para `America/Sao_Paulo`)
- Tests: `vitest` + `@testing-library/react`
- Lint/format: `eslint` + `prettier`

**Modo de trabalho**: cada etapa abaixo = um ciclo de PR/commit + checkpoint. Paramos ao final de cada uma, validamos, decidimos se ajusta antes de seguir.

---

## Estratégia geral

Seguimos a ordem recomendada no PRD §25 (engine → pipeline → dashboard → clone), com um ajuste: **clonamos o quiz de referência assim que o runtime básico estiver pronto** (Etapa 5), antes de investir no pipeline de analytics. Por quê? Porque a fidelidade visual é o requisito mais visível e traz risco de retrabalho se adiada. Analytics é bem-especificado no PRD e menos ambíguo de construir depois.

Ordem de risco: **visual > analytics > dashboard**. Matamos o risco visual cedo.

---

## Estrutura alvo do repositório

```
QuizEngine/
├── public/
├── src/
│   ├── quiz/                → runtime público do quiz
│   │   ├── engine/          (parser schema, registry, navigation)
│   │   ├── components/      (todos os componentes do registry)
│   │   ├── store/           (zustand: session, variables)
│   │   ├── tracking/        (sendBeacon, fila, eventos)
│   │   ├── schemas/         (treino-em-casa-es.json e futuros)
│   │   └── pages/           (QuizPage.tsx, etc.)
│   ├── dashboard/           → área autenticada
│   │   ├── pages/           (Overview, Funnel, Origin)
│   │   ├── components/      (charts, filters, tables)
│   │   └── data/            (queries para edge functions)
│   ├── shared/              → utils comuns
│   │   ├── supabase/        (client)
│   │   ├── utils/
│   │   └── ui/              (shadcn/ui)
│   ├── App.tsx              (router)
│   └── main.tsx
├── supabase/
│   ├── config.toml          (já existe)
│   ├── migrations/          (SQL migrations)
│   └── functions/
│       ├── track/           (ingestão de eventos)
│       └── metrics/         (read model)
├── docs/
│   └── IMPLEMENTATION_PLAN.md  (este arquivo)
├── .env.example
├── .gitignore
├── CLAUDE.md                (convenções para futuras sessões)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json
└── README.md
```

**Roteamento**:
- `/q/:slug` — runtime público (slug = ex. `treino-em-casa-es`)
- `/admin/*` — dashboard autenticado
- `/` — redirect para `/q/treino-em-casa-es` (default da v1)

---

## Etapas

### Etapa 0 — Fundação (setup do projeto)

**Objetivo**: repositório pronto pra codar, com todas as decisões técnicas materializadas.

**Tarefas**:
1. Criar `package.json` com Vite + React + TypeScript
2. Configurar `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
3. Instalar shadcn/ui base + alguns componentes sementes (button, input, card)
4. Instalar: `zustand`, `zod`, `react-hook-form`, `react-router-dom`, `recharts`, `lucide-react`, `date-fns`, `date-fns-tz`, `@supabase/supabase-js`
5. Configurar ESLint + Prettier
6. Criar estrutura de pastas conforme acima
7. Router básico em `App.tsx` com rotas `/q/:slug` e `/admin` (placeholders)
8. Cliente Supabase em `src/shared/supabase/client.ts`
9. `.env.example` com placeholders: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GTM_ID`, `VITE_CHECKOUT_URL`
10. `.gitignore` raiz (node_modules, dist, .env, .env.local)
11. `vercel.json` com rewrites para SPA
12. `CLAUDE.md` com convenções (stack, pastas, padrões de commit)
13. Rodar `supabase start` uma vez e registrar URL/anon key local no `.env.local`
14. Commit inicial

**Arquivos críticos**: `package.json`, `src/App.tsx`, `src/shared/supabase/client.ts`, `CLAUDE.md`

**Checkpoint**: `pnpm dev` sobe, rota `/q/treino-em-casa-es` mostra placeholder, `/admin` mostra placeholder, `supabase start` roda local e Studio abre na `54323`.

---

### Etapa 1 — Engine de Schema + Runtime

**Objetivo**: renderizar qualquer quiz a partir de schema JSON, com navegação funcional (sem componentes visuais reais ainda).

**Tarefas**:
1. Tipos TS em `src/quiz/engine/types.ts`: `QuizSchema`, `StepSchema`, `ComponentSchema`, `VariableDef`, `ActionMap`
2. Schema Zod equivalente em `src/quiz/engine/schema.ts`
3. Registry de componentes: `src/quiz/engine/registry.ts`
4. Store Zustand em `src/quiz/store/session.ts`:
   - `currentStepId`, `history[]` (stack de etapas visitadas)
   - `variables: Record<string, unknown>`
   - `sessionId`, `startedAt`, `lastSeenAt`
   - Actions: `advance(nextStepId)`, `back()`, `setVariable(key, value)`
5. Engine de renderização: `src/quiz/engine/StepRenderer.tsx`
6. Motor de cálculo: `src/quiz/engine/compute.ts` (parser seguro, **nunca** `eval`/`Function`)
7. Theming: converter `theme` do schema em CSS variables aplicadas no root do runtime
8. Progress bar simples (nativo, polish depois)
9. Página `QuizPage.tsx`: carrega schema via import estático de um mock, valida com zod, monta runtime
10. Schema mock de 5 etapas (`src/quiz/schemas/mock.json`)
11. Placeholders no registry (cada tipo renderiza `<div>[{type}] {props}</div>`)

**Arquivos críticos**:
- `src/quiz/engine/types.ts`
- `src/quiz/engine/schema.ts`
- `src/quiz/engine/registry.ts`
- `src/quiz/engine/StepRenderer.tsx`
- `src/quiz/store/session.ts`

**Checkpoint**: navego pelas 5 etapas mock com next/back, progress avança, variáveis gravadas no store aparecem em `/admin` debug.

---

### Etapa 2 — Componentes visuais (leva básica)

**Objetivo**: ter os componentes "simples" do quiz de referência funcionando com polish visual via Tailwind.

**Componentes a entregar**:
- `Heading` / `Subheading`
- `Text` (paragraph)
- `Image` (com aspect-ratio + loading lazy)
- `Button` / `CTAButton` (primary variant)
- `SingleChoice` (cards clicáveis, com e sem imagem — avança automaticamente na seleção)
- `MultiChoice` (checkboxes, botão "continuar")
- `TextInput` (binding em variável)
- `NumberInput` (binding em variável)
- `ProgressBar` (sincronizado com `step.progress` ou `order`)

**Padrão de componente**:
```ts
type ComponentProps = {
  config: ComponentConfig;   // do schema
  context: RuntimeContext;   // variables, setVariable, advance, back
};
```

**Checkpoint**: schema fake com 8 etapas que cobrem todos os 9 componentes, navego fluido, respostas ficam no store.

---

### Etapa 3 — Componentes avançados

**Objetivo**: cobrir os componentes específicos do quiz de referência que exigem mais trabalho.

**Componentes**:
- `HeightPicker` (cm)
- `WeightPicker` (kg)
- `AgePicker` (anos)
- `BMIGauge` (gráfico animado do IMC — usa `bmi` computada)
- `ProgressChart` (evolução projetada — recharts)
- `ImageCarousel` (dots/arrows, autoplay opcional)
- `LoadingScreen` (tela "analisando..." — timer configurável, avança sozinho)
- `VideoScriptEmbed` — **requisito crítico (PRD §8.6)**
- `ResumeToast` (notificação de retomada, 1x ao carregar)

**Detalhe do `VideoScriptEmbed`** (§8.6):
- Aceita `scriptSrc` e/ou `inlineScript` via config
- Monta o `<script>` via ref dentro do slot, não no `document`
- Desmonta/remonta corretamente ao navegar back→forward para evitar duplicação
- Expõe `containerId` configurável
- Se o script injeta iframe, garantir remount após unmount

**Checkpoint**: quiz fake que exercita todos os componentes avançados, incluindo um vídeo de teste que renderiza no slot correto mesmo após back/forward.

---

### Etapa 4 — Sessão & Persistência

**Objetivo**: atender §15 e §8.5 do PRD — retomada automática por 24h.

**Tarefas**:
1. Gerar `sessionId` (UUID v4) no primeiro load, persistir em `localStorage` com chave `pq.session.{quizSlug}`
2. Ao carregar, se existir sessão válida (`now - lastSeenAt < 24h`) do mesmo quiz:
   - Restaurar `currentStepId`, `variables`, `history`
   - Mostrar `ResumeToast`
   - Disparar evento `quiz_resume` (estrutura preparada; tracking real vem na Etapa 7)
3. Se expirada, criar nova sessão
4. Atualizar `lastSeenAt` a cada advance/back
5. API do store: `hydrate()`, `clear()`, `isExpired()`

**Checkpoint**: completo 10 etapas de um quiz, fecho aba, reabro em <24h → volta na etapa 10 com toast visível. Reabro em >24h (ajustar timestamp manualmente) → começa do zero.

---

### Etapa 5 — Clone fiel do quiz de referência

**Objetivo**: materializar o quiz de referência (treino em casa) real em cima da engine.

**Tarefas**:
1. **Extração de assets/copy** (manual, assistido):
   - Assistir a gravação `.mov` frame por frame
   - Screenshot de cada uma das 35 etapas
   - Transcrever copy para `src/quiz/schemas/treino-em-casa-es.copy.md`
   - Listar assets que precisam ser extraídos/recriados
   - **Gap**: fidelidade 100% depende de acesso aos assets originais; se só temos a gravação, alguns serão aproximações. Cada caso apontado no QA.
2. Montar `src/quiz/schemas/treino-em-casa-es.json` com as 35 etapas
3. Configurar `theme` com cores/fontes aproximadas
4. QA visual etapa por etapa — checklist de paridade (§23.1)
5. Ajustes finos: espaçamentos, animações, tipografia
6. Rota `/q/treino-em-casa-es` renderiza o clone real (não mais mock)

**Arquivos críticos**:
- `src/quiz/schemas/treino-em-casa-es.json`
- `src/quiz/schemas/treino-em-casa-es.copy.md`
- `public/quiz/treino-em-casa-es/assets/`

**Checkpoint**: side-by-side no navegador — gravação original à esquerda, clone à direita. Aprovação visual explícita antes de ir para Etapa 6.

---

### Etapa 6 — Backend Supabase (schema + ingestão)

**Objetivo**: esquema de dados + edge function de ingestão conforme §13 e §16 do PRD.

**Tarefas**:
1. Migration `20260415_init.sql`:
   - `quizzes` (id, slug, name, version, schema_json, status, timestamps)
   - `quiz_sessions` (id, quiz_id, session_token, utm_source, origin, device_type, country, traffic_quality, is_started, is_completed, current_step_id, expires_at, timestamps)
   - `quiz_events` (id, quiz_id, session_id, event_name, step_id, step_order, event_ts, payload_jsonb, utm_source, origin, device_type, country, traffic_quality, idempotency_key)
   - UNIQUE `(session_id, idempotency_key)` quando não-null → dedup
   - Índices: `(quiz_id, event_ts)`, `(session_id)`, `(event_name, event_ts)`
2. Migration `20260415_rls.sql`:
   - RLS on em todas as tabelas
   - Write: bloqueado para anon, permitido só via service role
   - Read: bloqueado para anon; `authenticated` lê via policy (Etapa 9)
3. Edge function `supabase/functions/track/index.ts`:
   - POST recebe `{ event_name, quiz_slug, session_token, step_id?, step_order?, payload? }`
   - Valida payload com zod
   - Lookup/create `quiz_sessions`
   - Classifica `traffic_quality` via user agent (Googlebot, facebookexternalhit, Twitterbot, bingbot, etc.)
   - Insere em `quiz_events` com `idempotency_key` quando aplicável (§16.3)
   - Extrai UTM do referer/body, device via UA, country via header (Cloudflare/Vercel)
   - CORS liberado para o domínio do quiz
   - Retorna 202 rapidamente

**Arquivos críticos**:
- `supabase/migrations/20260415_init.sql`
- `supabase/migrations/20260415_rls.sql`
- `supabase/functions/track/index.ts`

**Checkpoint**: `curl` na edge function local → registro aparece em `quiz_events`. Idempotency key duplicada não duplica.

---

### Etapa 7 — Tracking no cliente + GTM

**Objetivo**: disparar os 7 eventos obrigatórios do §10 do PRD com resiliência (§11.2).

**Tarefas**:
1. Camada `src/quiz/tracking/client.ts`:
   - Fila em memória
   - `flush()` usa `navigator.sendBeacon` → fallback `fetch(url, { keepalive: true })`
   - Auto-flush a cada 500ms + em `visibilitychange` hidden
2. Hook `useQuizTracking()` integrado com store e engine
3. Integrar na engine:
   - Primeiro step montado → `quiz_visit`
   - Primeira transição válida fora do step inicial → `quiz_start`
   - Entrada em step → `step_view`
   - Advance → `step_advance`
   - Back → `step_back`
   - Retomada → `quiz_resume`
   - Clique no CTA final → `quiz_complete_cta_click`
4. Captura no load: `utm_*`, `document.referrer`, UA
5. GTM integration:
   - Script no `index.html` com `VITE_GTM_ID`
   - `window.dataLayer.push(event)` paralelo (não bloqueante)
   - GTM **não é fonte oficial**, só espelhamento

**Arquivos críticos**:
- `src/quiz/tracking/client.ts`
- `src/quiz/tracking/events.ts`
- `src/quiz/tracking/useQuizTracking.ts`
- `index.html`

**Checkpoint**: run completo do quiz local; no Supabase Studio todos os 7 eventos com session_id, step_id e timestamp corretos. `dataLayer` tem espelho no DevTools.

---

### Etapa 8 — Read model + agregados

**Objetivo**: queries prontas pra alimentar o dashboard (§9.1, §9.2, §9.3).

**Tarefas**:
1. View/materialized view `quiz_step_funnel_daily` agregando por `(quiz_id, date_bucket TZ=America/Sao_Paulo, step_order, utm_source)`:
   - `unique_sessions_reached`
   - `unique_sessions_advanced`
   - `unique_final_clicks`
2. View `quiz_overview_daily`: visits, starts, final_clicks deduplicados por session
3. Edge function `supabase/functions/metrics/index.ts`:
   - Endpoints: `/overview`, `/funnel`, `/origin`
   - Params: `quiz_slug`, `date_from`, `date_to`, `compare: boolean`, `utm_source?`
   - Converte timezone (`America/Sao_Paulo`)
   - Se `compare=true`, retorna também período anterior equivalente
   - Filtra `traffic_quality='human'` por padrão
   - Exige JWT (role `authenticated`)
4. Refresh da materialized view: on-demand na v1 (simples), agendamento fica pra futuro

**Arquivos críticos**:
- `supabase/migrations/20260416_aggregates.sql`
- `supabase/functions/metrics/index.ts`

**Checkpoint**: `curl` com JWT retorna overview/funnel/origin com dados do quiz completado na Etapa 7.

---

### Etapa 9 — Dashboard interno

**Objetivo**: UI pro time de CRO conforme §18 do PRD.

**Tarefas**:
1. Auth: página `/admin/login` com Supabase Auth (magic link)
2. Guard de rota: `/admin/*` exige sessão
3. **Tela 1 — Overview** (`/admin`): cards visitas/interações/taxa/cliques finais + comparação período anterior + line chart
4. **Tela 2 — Funil** (`/admin/funnel`): tabela step_order/analytics_key/absoluto/conversão acumulada/drop + barras horizontais
5. **Tela 3 — Origem** (`/admin/origin`): agrupado por utm_source (fallback origin), métricas por linha
6. Filtros globais: hoje / ontem / 7d / custom + comparação on/off, timezone fixo
7. Layout shadcn (sidebar + topbar)
8. Todas as queries via edge function `metrics/*`

**Arquivos críticos**:
- `src/dashboard/pages/Overview.tsx`
- `src/dashboard/pages/Funnel.tsx`
- `src/dashboard/pages/Origin.tsx`
- `src/dashboard/components/DateFilter.tsx`
- `src/dashboard/components/AuthGuard.tsx`

**Checkpoint**: completo o quiz local 5x com UTMs diferentes, abro dashboard, números batem com cruzamento manual no Studio.

---

### Etapa 10 — Deploy + QA final

**Objetivo**: entregar a v1 em produção atendendo os critérios do §20 do PRD.

**Tarefas**:
1. Provisionar projeto no **Supabase Cloud**
2. Rodar migrations no remoto: `supabase db push`
3. Deploy das edge functions: `supabase functions deploy track metrics`
4. Configurar secrets/env vars
5. Deploy Vercel com env apontando pro Supabase Cloud
6. DNS: subdomínio `quiz.example.com` → Vercel
7. Checklist §20 do PRD item a item
8. Checklist de paridade visual com a gravação
9. Smoke test: incógnito, completar quiz, ver evento no dashboard < 1min
10. `README.md` mínimo: como rodar, deployar, adicionar novo quiz

**Checkpoint final**: v1 atende §26 do PRD (definição de sucesso).

---

## Verificação end-to-end (no final do ciclo completo)

1. **Smoke test do runtime**: `/q/treino-em-casa-es` em incógnito, completa sem erros de console, vídeo no slot, retomada funciona
2. **Smoke test do tracking**: 7 eventos aparecem no Supabase com metadados corretos
3. **Smoke test do dashboard**: métricas refletem o run com < 1 min de delay
4. **Paridade visual**: side-by-side com a gravação original
5. **Bot filter**: UA `facebookexternalhit/1.1` → classificado como `bot`, fora do dashboard default
6. **Timezone**: evento 23:30 BRT → bucket do dia correto

---

## Riscos abertos / coisas pra confirmar durante execução

1. **Assets do quiz de referência**: só temos a gravação. Fidelidade pixel-perfect pode ser limitada. Aceitável aproximar ou tem acesso aos assets originais (Figma, PSDs, CDN URLs)?
2. **GTM container ID**: qual usar? Placeholder até a Etapa 7.
3. **URL do checkout final**: confirmar URL exata.
4. **Subdomínio `quiz.example.com`**: DNS em que provedor? Quem cria o CNAME?
5. **Login do dashboard**: magic link por email, allowlist de emails?
6. **Política de bots**: começamos com lista estática (~10 UAs). Evolução futura fora da v1.

Pergunto cada um quando chegarmos na etapa onde a resposta importa.

---

## Timeline (referência grosseira)

- Etapa 0: ~1 ciclo (setup)
- Etapas 1–4: runtime + componentes + sessão (bloco mais intenso)
- Etapa 5: clone (depende de acesso a assets)
- Etapas 6–9: backend + tracking + dashboard
- Etapa 10: deploy + QA

Ordem sequencial por design — cada etapa depende das anteriores. **Paramos ao fim de cada etapa** pra validar e decidir se ajusta antes de seguir.
