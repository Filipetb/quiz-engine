# QuizEngine

Runtime de quiz/funil guiado por schema JSON + pipeline de analytics próprio (Supabase) + dashboard de CRO.

Cada quiz é **um arquivo JSON**. Nada de código por quiz: o runtime lê o schema, renderiza os
componentes, cuida de navegação, sessão de 24h, tracking e métricas.

Referências:

- [`docs/AGENT_QUIZ_AUTHORING.md`](docs/AGENT_QUIZ_AUTHORING.md) — **guia de autoria de quizzes** (feito para IA, útil para humanos)
- [`PRD.md`](PRD.md) — requisitos completos
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — plano em etapas (v1 concluída)
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

---

## Criando um quiz novo com IA (Claude Code, Codex etc.)

O [`docs/AGENT_QUIZ_AUTHORING.md`](docs/AGENT_QUIZ_AUTHORING.md) é **autossuficiente**: descreve o formato
do schema, os 22 tipos de componente, as regras de validação, templates de funil e uma tabela
"print → componente". Um agente que lê só esse documento consegue entregar um JSON que roda
de primeira — **não precisa ter acesso ao código**.

Isso permite dois modos de uso:

- **Dentro do projeto** (Claude Code / Codex abertos nesta pasta): o agente lê o guia, cria o
  arquivo, registra o quiz e valida com `pnpm test`.
- **Fora do projeto** (qualquer pasta, claude.ai, ChatGPT): passe o guia como link ou anexo e
  peça o JSON. Depois siga [Publicando o JSON](#publicando-o-json-gerado).
  Link direto para agentes que leem URLs:
  `https://raw.githubusercontent.com/Filipetb/quiz-engine/main/docs/AGENT_QUIZ_AUTHORING.md`

### Fontes para clonar um funil

Escolha a que você tiver. Quanto mais fiel a fonte, menos ajuste manual depois.

> Use funis seus ou que você tem autorização para reproduzir. Troque marca, copy e imagens
> de terceiros antes de publicar.

#### 1. Link do quiz → agente navega com Playwright

O agente abre o quiz num navegador real, responde etapa por etapa, tira print de cada tela e
extrai textos, opções e imagens.

Instale o MCP do Playwright uma vez:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

```bash
codex mcp add playwright -- npx @playwright/mcp@latest
```

Prompt sugerido:

```text
Leia docs/AGENT_QUIZ_AUTHORING.md inteiro antes de começar.

Use o Playwright para abrir https://SEU-QUIZ.com e percorrer o funil até o checkout.
Em cada etapa: tire screenshot, anote todos os textos, opções, imagens e o tipo de input.
Responda de forma coerente para conseguir avançar (escolha a primeira opção quando não importar).
Salve os prints em ./referencia/<slug>/ numerados por etapa.

Depois gere src/quiz/schemas/<slug>.json seguindo o guia (seção 13 para mapear print → componente),
baixe as imagens para public/images/<slug>/ e referencie como /images/<slug>/arquivo.webp.
Registre o quiz em src/quiz/pages/QuizPage.tsx e rode `pnpm test` até passar.
```

#### 2. Gravação de tela (.mov / .mp4)

Os agentes leem imagens, não vídeo. Extraia frames com `ffmpeg` (um a cada 2 segundos, ou só
nas trocas de tela):

```bash
mkdir -p referencia/frames && ffmpeg -i gravacao.mov -vf "fps=1/2" referencia/frames/%03d.png
```

```bash
mkdir -p referencia/frames && ffmpeg -i gravacao.mov -vf "select='gt(scene,0.3)'" -vsync vfr referencia/frames/%03d.png
```

Prompt sugerido:

```text
Leia docs/AGENT_QUIZ_AUTHORING.md inteiro.
Em ./referencia/frames/ estão frames de uma gravação de tela de um quiz, em ordem.
Identifique cada etapa distinta (ignore frames repetidos ou de transição), transcreva a copy
e gere src/quiz/schemas/<slug>.json. Onde não der para ler um texto ou extrair uma imagem,
use um placeholder e liste no final o que ficou pendente.
```

#### 3. Prints das etapas

Salve os prints numerados (`01.png`, `02.png`…) numa pasta e use o mesmo prompt da gravação,
apontando para essa pasta. Se estiver fora do projeto, anexe os prints e o guia na conversa.

### Publicando o JSON gerado

Quando o agente não fez isso por você:

1. Salve como `src/quiz/schemas/<slug>.json` (o nome do arquivo é o `quiz.slug`).
2. Registre em [`src/quiz/pages/QuizPage.tsx`](src/quiz/pages/QuizPage.tsx):
   ```ts
   import meuQuizSchemaRaw from '@/quiz/schemas/meu-quiz.json';

   const SCHEMA_REGISTRY: Record<string, unknown> = {
     // ...
     'meu-quiz': meuQuizSchemaRaw,
   };
   ```
3. Cadastre o slug na tabela `quizzes` — sem isso a edge function `track` rejeita os eventos e o
   quiz não aparece no dashboard. Em local, adicione em [`supabase/seed.sql`](supabase/seed.sql)
   e rode `supabase db reset`; em produção, rode o mesmo `insert` no SQL Editor do Supabase.
4. `pnpm test` — valida **todos** os schemas contra as regras do runtime.
5. `pnpm dev` e abra `http://localhost:5173/q/<slug>`.

---

## Alterando um quiz

### Pedindo para a IA

Qualquer alteração pode ser pedida em linguagem natural ao Claude Code ou Codex aberto no
projeto. Exemplos:

```text
No quiz treino-em-casa-es, troque o link de checkout por https://pay.exemplo.com/abc
nos três botões de compra.
```

```text
No sono-do-bebe, adicione uma pergunta "Quantos meses tem seu bebê?" depois da etapa de idade,
com as opções 0–6, 6–12, 12–24 e 24+. Siga docs/AGENT_QUIZ_AUTHORING.md e rode pnpm test.
```

```text
Mude o tema do quiz-gluteos-es para tons de verde e aumente o delay do pitch do vídeo para 3 minutos.
```

### Editando manualmente

O schema é JSON puro, então dá para editar em qualquer editor. A estrutura:

```jsonc
{
  "quiz":      { "id": "meu-quiz", "slug": "meu-quiz", "name": "Meu Quiz", "version": 1 },
  "theme":     { "colors": { "bg": "0 0% 100%", "accent": "330 81% 60%", ... }, "radius": "0.75rem" },
  "variables": { "goal": { "type": "string" }, "bmi": { "type": "number", "compute": "..." } },
  "steps": [
    {
      "id": "goal", "order": 1, "analyticsKey": "goal",
      "components": [
        { "type": "heading", "text": "Qual é o seu objetivo?" },
        { "type": "single_choice", "variable": "goal", "options": [ ... ] }
      ]
    }
  ]
}
```

Edições mais comuns:

| Quero… | Onde mexer |
| --- | --- |
| Mudar um texto | `text` / `label` / `caption` do componente. `**negrito**` e `{variavel}` funcionam nos campos listados na seção 10 do guia |
| Trocar o link de checkout | `href` dos componentes `button` (precisa ser URL absoluta) |
| Trocar o vídeo | `scriptSrc` e `playerAttributes.id` do `video_script` (ou o `src` do iframe em `inlineScript`) |
| Mudar quando o botão aparece após o vídeo | `pitchSync.delaySeconds` do `video_script` |
| Mudar cores | `theme.colors` em HSL **sem** `hsl()`: `"330 81% 60%"` |
| Trocar uma imagem | coloque o arquivo em `public/images/` e use `"/images/arquivo.webp"`, ou uma URL absoluta |
| Adicionar/remover opção | array `options` do `single_choice` / `multi_choice` |
| Adicionar uma etapa | novo objeto em `steps` com `id`, `order` e `analyticsKey` únicos |
| Mudar a ordem das etapas | campo `order` (a posição no array não importa) |

Regras que evitam dor de cabeça:

- **Não renomeie `step.id` nem `analyticsKey` de um quiz que já está no ar.** As métricas do
  dashboard agrupam por eles; renomear quebra o histórico do funil.
- JSON não aceita comentários nem vírgula sobrando no final.
- Rode `pnpm test` depois de editar. Se algo estiver inválido, o teste aponta o caminho do erro
  (e a página do quiz mostra "Schema inválido").
- Referência completa de cada componente: seção 9 do [guia](docs/AGENT_QUIZ_AUTHORING.md).

---

## Scripts

| Comando          | O que faz                               |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Vite dev server                         |
| `pnpm build`     | Build de produção                       |
| `pnpm typecheck` | `tsc -b --noEmit`                       |
| `pnpm lint`      | ESLint                                  |
| `pnpm format`    | Prettier                                |
| `pnpm test`      | Vitest (inclui validação dos schemas)   |

## Estado atual

v1 concluída: Etapas 0–10 do [plano de implementação](docs/IMPLEMENTATION_PLAN.md) entregues
(runtime, componentes, sessão, tracking, métricas, dashboard e deploy).
