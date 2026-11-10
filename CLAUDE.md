# QuizEngine — Convenções para assistentes de IA

Este arquivo orienta sessões futuras do Claude (e humanos).
Referências primárias: [`PRD.md`](PRD.md) e [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Stack

- **Build**: Vite 5 + React 18 + TypeScript (strict)
- **Router**: `react-router-dom` v6
- **State**: `zustand` (nunca Redux/Context para estado de aplicação)
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **UI**: Tailwind CSS + shadcn/ui (aliases: `@/shared/ui`)
- **Charts**: `recharts`
- **Icons**: `lucide-react`
- **Datas**: `date-fns` + `date-fns-tz` (timezone oficial: `America/Sao_Paulo`)
- **Tests**: `vitest` + `@testing-library/react` + `jsdom`
- **Lint/format**: `eslint` + `prettier` + `prettier-plugin-tailwindcss`
- **Backend**: Supabase (Postgres + Edge Functions + Auth)
- **Package manager**: `pnpm` (via `corepack`)

## Estrutura de pastas

```
src/
├── quiz/         Runtime público do quiz (rota /q/:slug)
│   ├── engine/       Parser de schema, registry, StepRenderer, compute
│   ├── components/   Componentes do registry (Heading, SingleChoice, VideoScriptEmbed, etc.)
│   ├── store/        Zustand: session, variables, navegação
│   ├── tracking/     sendBeacon + fila, eventos obrigatórios do PRD §10
│   ├── schemas/      JSON dos quizzes (ex.: treino-em-casa-es.json)
│   └── pages/
├── dashboard/    Área autenticada (rotas /admin/*)
│   ├── pages/        Overview, Funnel, Origin
│   ├── components/   Charts, filtros, tabelas
│   └── data/         Fetchers das edge functions de métricas
├── shared/
│   ├── supabase/     Cliente Supabase
│   ├── ui/           Primitives shadcn
│   ├── utils/        cn, helpers
│   ├── hooks/
│   ├── pages/        Páginas compartilhadas (404)
│   └── test/         Setup do vitest
├── App.tsx           Roteador
└── main.tsx
```

Aliases TS: `@/...` → `./src/...`.

## Regras de código

1. **Nunca use `eval` ou `new Function`** — o motor de cálculo do schema usa parser restrito (PRD §8.4).
2. **Tracking nunca bloqueia navegação** — use `navigator.sendBeacon` com fallback `fetch(..., { keepalive: true })` (PRD §11.2).
3. **Dedup por sessão nas métricas principais** — etapa conta 1x por sessão (PRD §9.2). Implementado no backend via `idempotency_key`.
4. **Timezone fixo `America/Sao_Paulo`** para qualquer agregado/display no dashboard (PRD §9.3).
5. **RLS sempre on** — escrita só via service role (edge functions). Anon não escreve direto em nenhuma tabela.
6. **Schema é a fonte da verdade do quiz** — nenhuma lógica de navegação ou componente hardcoded fora do schema.
7. **Componentes do registry** seguem o contrato:
   ```ts
   type ComponentProps = {
     config: ComponentConfig;   // do schema JSON
     context: RuntimeContext;   // variables, setVariable, advance, back
   };
   ```
8. **Preferir edits em arquivos existentes** a criar novos arquivos, salvo quando a estrutura do plano exigir.
9. **Sem comentários que explicam "o quê"** — nomes claros bastam. Comentários só quando o **porquê** é não-óbvio.

## Fluxo de trabalho por etapas

O plano em [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) define 11 etapas sequenciais (0–10). A cada fim de etapa, para, valida com o humano, commita, segue.

## Comandos

```bash
pnpm dev              # sobe Vite em 5173
pnpm build            # build de produção
pnpm typecheck        # só tsc, sem build
pnpm lint             # ESLint strict
pnpm format           # Prettier em src/
pnpm test             # Vitest one-shot
pnpm test:watch       # Vitest em watch

supabase start        # sobe stack local (Postgres, Auth, Edge)
supabase stop         # para a stack
supabase db push      # aplica migrations no Cloud (Etapa 10)
supabase functions serve track  # dev local de edge function
```

## Gotchas conhecidos

- **Porta Supabase**: `config.toml` está customizado para portas `543xx` fora do range padrão para não conflitar com outros projetos Supabase locais. Sempre usar as portas do `config.toml` deste projeto.
- **Vídeo via script (PRD §8.6)**: o `VideoScriptEmbed` precisa montar/desmontar limpamente para não duplicar no back/forward. Vide implementação na Etapa 3.
- **GTM não é fonte oficial** — eventos vão pro Supabase direto; GTM recebe espelho via `dataLayer.push` (PRD §7/§9).
