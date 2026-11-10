# QuizEngine

Runtime de quiz/funil guiado por schema JSON + pipeline de analytics próprio (Supabase) + dashboard de CRO.

Referências:

- [`PRD.md`](PRD.md) — requisitos completos
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — plano em etapas
- [`docs/AGENT_QUIZ_AUTHORING.md`](docs/AGENT_QUIZ_AUTHORING.md) — guia para gerar schemas de quiz
- [`CLAUDE.md`](CLAUDE.md) — convenções técnicas

## Schemas de exemplo

Ficam em `src/quiz/schemas/` e são servidos em `/q/:slug`:

| Slug | Nicho |
| --- | --- |
| `treino-em-casa-es` / `treino-em-casa-en` | Treino em casa (calistenia) — funil completo com VSL e checkout |
| `quiz-gluteos-es` | Treino de glúteos |
| `sono-do-bebe` / `sono-do-bebe-v2` | Sono do bebê |
| `mock`, `playground`, `advanced`, `agentsample` | Demonstração de componentes |

Links de checkout apontam para `https://example.com/checkout` e os players de vídeo usam IDs
placeholder (`YOUR_ACCOUNT_ID`, `YOUR_PLAYER_ID`, `YOUR_VIDEO_ID`). Substitua pelos seus para ver o vídeo.

## Setup local

Requisitos: Node 20+, Docker, Supabase CLI, pnpm (via `corepack`).

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install

cp .env.example .env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com os valores de `supabase status`.

supabase start
pnpm dev
```

Rotas:

- `http://localhost:5173/q/treino-em-casa-es` — runtime do quiz
- `http://localhost:5173/admin` — dashboard

## Scripts


| Comando          | O que faz         |
| ---------------- | ----------------- |
| `pnpm dev`       | Vite dev server   |
| `pnpm build`     | Build de produção |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint`      | ESLint            |
| `pnpm format`    | Prettier          |
| `pnpm test`      | Vitest            |


## Estado atual

**Etapa 10 —** Deploy + QA final. Próximas etapas em `[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)`.