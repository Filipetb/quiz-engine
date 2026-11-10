# Guia do autor de quizzes — para agentes de IA

> **Audiência**: agentes de IA (ex.: OpenClaw, Claude, GPT) que precisam gerar arquivos JSON de quiz para o runtime do **QuizEngine** sem ter acesso ao código-fonte do projeto.
>
> **Objetivo**: após ler este documento, o agente consegue entregar um único arquivo `.json` que passa na validação Zod do runtime e roda out-of-the-box ao ser adicionado ao projeto.
>
> **Fora de escopo**: editar código TypeScript, criar novos tipos de componente, alterar build ou tracking. O agente **só** produz JSON.

---

## Índice

1. [O que o agente deve entregar](#1-o-que-o-agente-deve-entregar)
2. [Estrutura raiz do schema](#2-estrutura-raiz-do-schema)
3. [Theme](#3-theme)
4. [Variables + expressões `compute`](#4-variables--expressões-compute)
5. [Steps](#5-steps)
6. [Navegação entre steps](#6-navegação-entre-steps)
7. [Tracking (automático, não declarar)](#7-tracking-automático-não-declarar)
8. [Campos comuns a todos os componentes](#8-campos-comuns-a-todos-os-componentes)
9. [Catálogo de componentes (22 tipos)](#9-catálogo-de-componentes-22-tipos)
10. [Interpolação `{var}` e destaque `**bold**`](#10-interpolação-var-e-destaque-bold)
11. [Cheat sheet de validação](#11-cheat-sheet-de-validação)
12. [Templates de funil prontos](#12-templates-de-funil-prontos)
13. [Tradução de screenshots → componentes](#13-tradução-de-screenshots--componentes)
14. [Convenções de nomenclatura](#14-convenções-de-nomenclatura)
15. [Checklist pré-entrega](#15-checklist-pré-entrega)
16. [Snippet de quiz mínimo válido](#16-snippet-de-quiz-mínimo-válido)
17. [Snippet de quiz rico](#17-snippet-de-quiz-rico)
18. [Anti-padrões (evite)](#18-anti-padrões-evite)

---

## 1. O que o agente deve entregar

**Um único arquivo** `<slug>.json` com o schema do quiz. Nada mais.

O humano responsável vai:

1. Salvar o arquivo em `src/quiz/schemas/<slug>.json`.
2. Registrar o slug em `src/quiz/pages/QuizPage.tsx` (adicionar import e chave em `SCHEMA_REGISTRY`).
3. O quiz fica imediatamente acessível em `/q/<slug>`.

O agente **não precisa** se preocupar com: build, routing, tracking, persistência, auth, analytics. Tudo isso é automático no runtime.

O JSON é validado em tempo de execução pelo Zod (`quizSchemaValidator`). Se qualquer regra desta doc for violada, a página exibe "Schema inválido" com a mensagem do erro e o quiz **não roda**. Gere com precisão cirúrgica.

---

## 2. Estrutura raiz do schema

```json
{
  "quiz":     { /* metadata — obrigatório */ },
  "theme":    { /* tokens visuais — opcional */ },
  "variables":{ /* declaração de estado — opcional */ },
  "steps":    [ /* etapas do funil — obrigatório, min 1 */ ]
}
```

### 2.1 `quiz` (obrigatório)

| campo     | tipo    | obrigatório | regra                                   |
| --------- | ------- | ----------- | --------------------------------------- |
| `id`      | string  | sim         | `length >= 1`, estável, kebab-case      |
| `name`    | string  | sim         | `length >= 1`, nome exibível            |
| `version` | number  | sim         | inteiro positivo (`1`, `2`, ...)        |
| `slug`    | string  | não         | se ausente, a URL usa `id`. Kebab-case. |

```json
"quiz": {
  "id": "treino-em-casa-es",
  "slug": "treino-em-casa-es",
  "name": "Treino em Casa — Calistenia",
  "version": 1
}
```

---

## 3. Theme

Opcional. Se ausente, o runtime aplica defaults.

```json
"theme": {
  "colors": {
    "bg":       "0 0% 100%",
    "fg":       "222 47% 11%",
    "accent":   "330 81% 60%",
    "accentFg": "0 0% 100%",
    "muted":    "210 40% 96%"
  },
  "radius": "0.75rem",
  "fonts":  { "sans": "Nunito, system-ui, sans-serif" }
}
```

**Regras críticas**:

- **Cores são HSL sem wrapper**. Use `"330 81% 60%"`, **nunca** `"hsl(330, 81%, 60%)"` nem hex (`"#E91E63"`). Os três números representam `H S% L%` separados por espaço.
- Só estas 5 chaves são aceitas em `colors`: `bg`, `fg`, `accent`, `accentFg`, `muted`. Qualquer outra é ignorada.
- `radius` é uma unidade CSS (`"0.75rem"`, `"12px"`, `"0"`).
- `fonts.sans` é uma única font-family (stack de fallbacks permitida).
- Não há gradients, sombras, ou cores extras.

---

## 4. Variables + expressões `compute`

Variáveis são o estado da sessão do usuário. Opcional — omita se o quiz não coleta nem usa variáveis.

### 4.1 Tipos

```
"string" | "number" | "boolean" | "string[]"
```

Uso por componente:

- `single_choice` → escreve `string` (o `value` da option).
- `multi_choice` → escreve `string[]`.
- `text_input` → escreve `string`.
- `number_input`, `height_picker`, `weight_picker`, `age_picker` → escrevem `number | null`.
- `compute` sempre produz `number` (ou `null` em falha).

### 4.2 Declaração

```json
"variables": {
  "name":           { "type": "string",   "default": "" },
  "goal":           { "type": "string",   "default": null },
  "obstacles":      { "type": "string[]", "default": [] },
  "height_cm":      { "type": "number",   "default": null },
  "weight_current": { "type": "number",   "default": null },
  "bmi": {
    "type": "number",
    "compute": "weight_current / ((height_cm / 100) * (height_cm / 100))"
  }
}
```

- `default`: opcional, aceita qualquer valor do tipo declarado ou `null`. Se ausente, inicia como `null`.
- `compute`: opcional, string com expressão aritmética.

### 4.3 Parser `compute` — capacidades e limites

**Suportado** (e só isso):

- Operadores binários: `+`, `-`, `*`, `/`.
- Parênteses: `(` `)`.
- Unário: `-x`, `+x`.
- Números literais: inteiros, floats, notação `.5`. **Não** aceita notação científica (`1e3`).
- Referências a identificadores (outras variáveis do schema). Identificadores: `[A-Za-z_][A-Za-z0-9_]*`.
- Espaços, tabs e quebras de linha são ignorados.

**Não suportado** (qualquer um destes faz o `compute` retornar `null` silenciosamente ou lançar erro):

- Chamadas de função: `Math.round(x)`, `abs(x)`, `min(a,b)` — proibidos.
- Acesso a propriedade: `obj.field`, `arr[0]` — proibidos.
- Strings, booleanos, arrays literais.
- Operadores lógicos/comparação: `&&`, `||`, `!`, `==`, `<`, `>`.
- Operador ternário: `x ? a : b` — **não existe condicional**.
- Potência: `**`, `^` — use multiplicação explícita: `x * x`.
- Módulo: `%` — proibido.

**Falhas silenciosas** (retornam `null`, quiz não quebra):

- Variável referenciada for `null`/`undefined`.
- Variável tem tipo não-numérico e não é string numérica.
- Divisão por zero.
- Resultado não é finito (`NaN`, `Infinity`).

**Exemplo canônico — IMC**:

```
"weight_current / ((height_cm / 100) * (height_cm / 100))"
```

**Recálculo**: toda vez que qualquer variável é `setVariable`, todos os `compute` dependentes são reavaliados na ordem do schema.

**Se precisar de lógica condicional**: não é possível no `compute`. A alternativa é:
- Usar `actions.next` para ramificar o funil em steps dedicados.
- Calcular só valores que fazem sentido com qualquer input (ex. IMC sempre faz sentido).

---

## 5. Steps

Array obrigatório, min 1 step.

```json
{
  "id":           "step-welcome",
  "order":        0,
  "analyticsKey": "welcome",
  "progress":     0,
  "components":   [ /* array de componentes — obrigatório */ ],
  "actions":      { "next": "step-custom-target" }
}
```

| campo          | tipo          | obrigatório | regra                                                                                |
| -------------- | ------------- | ----------- | ------------------------------------------------------------------------------------ |
| `id`           | string        | sim         | único dentro do quiz, `length >= 1`, kebab-case/snake_case                           |
| `order`        | number        | sim         | inteiro >= 0, sequencial (`0, 1, 2, ...`)                                            |
| `analyticsKey` | string        | sim         | chave estável para analytics, snake_case (`welcome`, `goal`, `measures`, `result`)   |
| `progress`     | number        | não         | 0..1, sobrescreve a barra de progresso. Se omitido, o runtime deriva de `order`.     |
| `components`   | array         | sim         | array de `ComponentSchema` (ver §9). Pode ser vazio (step só de transição).          |
| `actions`      | `{next,back}` | não         | ids de target; ver §6.                                                               |

**Regras**:

- IDs únicos (validado — duplicata trava o quiz).
- `analyticsKey` nunca deve mudar entre versões; é o identificador estável no dashboard.
- O último step é o "terminal": geralmente contém um `button` com `href` (checkout) ou um botão final.

---

## 6. Navegação entre steps

### 6.1 Linear (default)

Sem `actions`: `advance()` vai para o step com `order` imediatamente superior. Quando não há próximo, o quiz é marcado como completo.

### 6.2 `actions.next`

```json
"actions": { "next": "step-reveal" }
```

`advance()` pula para o step com esse `id`. **Validado**: se o id não existir, o schema é rejeitado.

### 6.3 `actions.back`

Raríssimo. Só use se quiser que o botão de voltar leve a um step específico (não o histórico).

### 6.4 Não existe skip logic condicional

O schema **não suporta** expressões em `actions.next` nem condicionais. Coisas como:

- `"if goal === 'lose' go to step-lose else step-gain"` — **impossível**.
- Ramificar com base em resposta — **só linearmente**.

Se precisar de conteúdos diferentes por resposta, as opções são:

1. **Replicar os steps**: criar `step-reveal-lose`, `step-reveal-gain`, e usar `actions.next` em cada branch. (Exige um step de decisão cujas opções levam a cada branch — mas como `single_choice` sempre avança via `actions.next` ou linear, só funciona se o step inteiro tiver apenas o choice e `actions.next` for o mesmo para todos → fica linear de novo.)
2. **Aceitar linearidade**: o mesmo step de resultado serve todos os perfis, usando interpolação `{var}` em headings para personalizar texto.
3. **Para a grande maioria dos quizzes**, linear é o padrão — mantenha simples.

### 6.5 Componentes que disparam `advance`

| componente          | quando avança                                                      |
| ------------------- | ------------------------------------------------------------------ |
| `button`            | click, se `action:"next"`                                          |
| `single_choice`     | 180ms após seleção, se `autoAdvance:true` (default)                |
| `multi_choice`      | click no botão "Continuar"                                         |
| `text_input`        | Enter ou click no botão "Continuar"                                |
| `number_input`      | Enter ou click no botão "Continuar"                                |
| `height_picker`     | click no botão "Continuar"                                         |
| `weight_picker`     | click no botão "Continuar"                                         |
| `age_picker`        | click no botão "Continuar"                                         |
| `loading_screen`    | automaticamente após `durationMs`                                  |

Componentes que **nunca** avançam sozinhos: `heading`, `text`, `image`, `callout`, `bmi_gauge`, `progress_bar`, `progress_chart`, `stat_bars`, `image_carousel`, `testimonial_carousel`, `faq`, `pricing_card`, `video_script`. Para avançar a partir deles, adicione um `button` no mesmo step.

### 6.6 Botão de voltar

Aparece **automaticamente no header** em todos os steps exceto o primeiro. O agente não precisa declarar nada; não coloque um `button action:"back"` só por isso (só se quiser um botão extra no corpo do step).

---

## 7. Tracking (automático, não declarar)

**O JSON não configura tracking. Zero. Não existe campo para isso.**

O runtime dispara automaticamente os 7 eventos abaixo:

| evento                       | quando                                                  |
| ---------------------------- | ------------------------------------------------------- |
| `quiz_visit`                 | 1× na abertura de `/q/<slug>`                           |
| `quiz_start`                 | 1× na primeira transição (primeiro `advance`)           |
| `step_view`                  | cada vez que um step é renderizado                      |
| `step_advance`               | ao avançar                                              |
| `step_back`                  | ao voltar                                               |
| `quiz_resume`                | quando a sessão é retomada do localStorage (24h TTL)    |
| `quiz_complete_cta_click`    | quando um `button href` é clicado no step final         |

Propriedades enviadas automaticamente: `quiz_slug`, `session_token`, `step_id`, `step_order`, `utm_source`, `origin`, `idempotency_key`. Tudo via `navigator.sendBeacon` + `dataLayer.push`.

**Único controle do agente**: definir `step.analyticsKey` de forma descritiva e estável. É o identificador visível no dashboard (funnel por etapa).

---

## 8. Campos comuns a todos os componentes

Qualquer componente aceita estes campos (todos opcionais):

- **`id`** (string): identificador opcional.
- **`className`** (string): classes Tailwind extras no container. Use com parcimônia — prefira customizar via `theme`.
- **`hiddenUntilPitch`** (boolean): quando `true`, o componente fica com `display:none` até que um `video_script` com `pitchSync` revele. Útil para esconder pricing/CTA até o pitch do VSL.

Cada componente também tem **obrigatoriamente** um campo discriminador `type` com o nome exato (snake_case).

---

## 9. Catálogo de componentes (22 tipos)

Lista exaustiva. Nenhum outro `type` existe. Inventar um (ex. `"video"` ou `"email_input"`) **não funciona**.

### Conteúdo estático

#### `heading`

Título do step (h1/h2/h3). Suporta interpolação `{var}` e destaque `**bold**`.

```json
{ "type": "heading", "text": "Qual é seu **principal** objetivo?", "level": 1 }
```

| prop  | tipo          | default | obs                              |
| ----- | ------------- | ------- | -------------------------------- |
| text  | string (req)  | —       | suporta `{var}` e `**destaque**` |
| level | `1` \| `2` \| `3` | `1`     | tag HTML                         |

---

#### `text`

Parágrafo. Sem interpolação, sem destaque.

```json
{ "type": "text", "text": "Este passo leva menos de 1 minuto." }
```

| prop | tipo         | default | obs |
| ---- | ------------ | ------- | --- |
| text | string (req) | —       | —   |

---

#### `image`

Imagem estática. Lazy-loaded. Use URLs absolutas e acessíveis publicamente.

```json
{
  "type": "image",
  "src": "https://cdn.example.com/hero.webp",
  "alt": "Capa do quiz",
  "aspectRatio": "2 / 1"
}
```

| prop        | tipo         | default | obs                                        |
| ----------- | ------------ | ------- | ------------------------------------------ |
| src         | string (req) | —       | URL absoluta                               |
| alt         | string       | `""`    | acessibilidade                             |
| aspectRatio | string       | —       | CSS aspect-ratio (`"16 / 9"`, `"2 / 1"`)   |

---

#### `callout`

Card colorido com título e corpo. Ambos aceitam `**destaque**`.

```json
{
  "type": "callout",
  "title": "Você está pronto!",
  "body": "Começar agora é **fácil**.",
  "variant": "success",
  "alignment": "center"
}
```

| prop      | tipo                                                             | default    | obs                      |
| --------- | ---------------------------------------------------------------- | ---------- | ------------------------ |
| title     | string                                                           | —          | suporta `**destaque**`   |
| body      | string                                                           | —          | suporta `**destaque**`   |
| variant   | `"success"` \| `"info"` \| `"warning"` \| `"danger"` \| `"accent"` | `"accent"` | semântica de cor         |
| alignment | `"left"` \| `"center"`                                            | `"center"` | alinhamento do texto     |

---

#### `faq`

Lista de Q&A estáticas (sem expansão — tudo sempre visível). Bom para o fim do funil.

```json
{
  "type": "faq",
  "items": [
    { "icon": "❓", "question": "Como funciona?", "answer": "Você responde o quiz e recebe um plano." },
    { "icon": "🔒", "question": "É seguro?",      "answer": "Pagamento processado por gateway confiável." }
  ]
}
```

| item.prop | tipo             | obs                        |
| --------- | ---------------- | -------------------------- |
| icon      | string           | emoji ou unicode, opcional |
| question  | string (req)     | texto puro, sem destaque   |
| answer    | string (req)     | texto puro, sem destaque   |

---

### Inputs

#### `text_input`

Input de texto livre. Escreve `string` em `variable`.

```json
{
  "type": "text_input",
  "variable": "first_name",
  "label": "Seu nome",
  "placeholder": "Digite seu nome",
  "required": true,
  "continueLabel": "Continuar"
}
```

| prop          | tipo    | default        | obs                          |
| ------------- | ------- | -------------- | ---------------------------- |
| variable      | string  | —              | chave em `variables` (req)   |
| label         | string  | —              | label do input               |
| placeholder   | string  | —              | —                            |
| required      | boolean | `false`        | se true, bloqueia avanço     |
| continueLabel | string  | `"Continuar"`  | texto do botão               |

---

#### `number_input`

Input numérico. Escreve `number | null` em `variable`.

```json
{
  "type": "number_input",
  "variable": "weight_current",
  "label": "Peso atual (kg)",
  "placeholder": "Ex.: 75",
  "min": 30,
  "max": 300,
  "required": true,
  "continueLabel": "Ver resultado"
}
```

| prop          | tipo    | default       | obs                                  |
| ------------- | ------- | ------------- | ------------------------------------ |
| variable      | string  | —             | req                                  |
| label         | string  | —             | —                                    |
| placeholder   | string  | —             | —                                    |
| min           | number  | —             | valor mínimo aceito                  |
| max           | number  | —             | valor máximo aceito                  |
| required      | boolean | `false`       | (default do componente é `true`; declare explicitamente para evitar ambiguidade) |
| continueLabel | string  | `"Continuar"` | —                                    |

---

#### `single_choice`

Seleção única em lista de opções. Escreve `string` (o `value`) em `variable`.

```json
{
  "type": "single_choice",
  "variable": "goal",
  "autoAdvance": true,
  "imageLayout": "grid",
  "options": [
    { "value": "lose",     "label": "Emagrecer",    "imageSrc": "https://cdn/img/lose.webp" },
    { "value": "gain",     "label": "Ganhar massa", "imageSrc": "https://cdn/img/gain.webp" },
    { "value": "maintain", "label": "Manter peso" }
  ]
}
```

| prop        | tipo                      | default  | obs                                                  |
| ----------- | ------------------------- | -------- | ---------------------------------------------------- |
| variable    | string                    | —        | req                                                  |
| options     | `ChoiceOption[]` (min 1)  | —        | req                                                  |
| autoAdvance | boolean                   | `true`   | avança 180ms após seleção                            |
| imageLayout | `"grid"` \| `"prepend"`   | `"grid"` | `grid`: 2 cols com foto grande; `prepend`: thumb esq |

`ChoiceOption`:
```ts
{ value: string, label: string, imageSrc?: string }
```

---

#### `multi_choice`

Seleção múltipla. Escreve `string[]` em `variable`. Sempre requer botão "Continuar".

```json
{
  "type": "multi_choice",
  "variable": "obstacles",
  "minSelected": 1,
  "maxSelected": 3,
  "continueLabel": "Continuar",
  "options": [
    { "value": "time",       "label": "Falta de tempo" },
    { "value": "motivation", "label": "Falta de motivação" },
    { "value": "diet",       "label": "Dificuldade com alimentação" }
  ]
}
```

| prop          | tipo                      | default              | obs                                       |
| ------------- | ------------------------- | -------------------- | ----------------------------------------- |
| variable      | string                    | —                    | req                                       |
| options       | `ChoiceOption[]` (min 1)  | —                    | req                                       |
| minSelected   | number                    | `1`                  | inteiro >= 0                              |
| maxSelected   | number                    | `options.length`     | inteiro > 0                               |
| continueLabel | string                    | `"Continuar"`        | —                                         |
| imageLayout   | `"grid"` \| `"prepend"`   | `"grid"`             | igual a `single_choice`                   |

---

### Pickers visuais (stepper −/+)

Os três abaixo compartilham a mesma API. Diferem apenas em `type` e `unit` default.

#### `height_picker`, `weight_picker`, `age_picker`

Stepper visual com botões −/+, slider e valor grande no centro. Escreve `number` em `variable`.

```json
{ "type": "height_picker", "variable": "height_cm", "min": 100, "max": 250, "default": 170, "unit": "cm" }
{ "type": "weight_picker", "variable": "weight_current", "min": 30,  "max": 300, "unit": "kg" }
{ "type": "age_picker",    "variable": "age", "min": 13,  "max": 100, "unit": "anos" }
```

| prop          | tipo   | default          | obs                                    |
| ------------- | ------ | ---------------- | -------------------------------------- |
| variable      | string | —                | req                                    |
| min           | number | —                | req                                    |
| max           | number | —                | req                                    |
| step          | number | `1`              | incremento; deve ser positivo          |
| default       | number | média de min/max | valor inicial                          |
| unit          | string | `cm`/`kg`/`anos` | texto exibido ao lado do número        |
| label         | string | —                | label acima do picker                  |
| continueLabel | string | `"Continuar"`    | —                                      |

---

### Reveal / resultado

#### `bmi_gauge`

Gauge horizontal animado com as 4 faixas da OMS (Abaixo / Ideal / Sobrepeso / Obesidade). Depende de uma `variable` numérica (tipicamente calculada via `compute`).

```json
{ "type": "bmi_gauge", "variable": "bmi", "caption": "Seu IMC atual." }
```

| prop     | tipo         | default | obs                                         |
| -------- | ------------ | ------- | ------------------------------------------- |
| variable | string (req) | —       | deve ser `number` calculado                 |
| caption  | string       | —       | texto curto abaixo do gauge                 |

Se a variável for `null`/`undefined`/não-numérica, o componente mostra um placeholder.

---

#### `progress_bar`

Barra horizontal animada com percentual fixo (decorativa).

```json
{
  "type": "progress_bar",
  "percent": 96,
  "color": "accent",
  "label": "Taxa de sucesso",
  "showValue": true
}
```

| prop      | tipo                      | default    | obs                   |
| --------- | ------------------------- | ---------- | --------------------- |
| percent   | number (req)              | —          | 0..100                |
| color     | `"accent"` \| `"success"` | `"accent"` | —                     |
| label     | string                    | —          | à esquerda            |
| showValue | boolean                   | `true`     | mostra `%` à direita  |

---

#### `progress_chart`

Gráfico de área com projeção de peso em semanas (recharts).

```json
{
  "type": "progress_chart",
  "weightVariable": "weight_current",
  "targetVariable": "weight_target",
  "weeks": 12,
  "title": "Projeção de 12 semanas"
}
```

| prop           | tipo         | default          | obs                                                           |
| -------------- | ------------ | ---------------- | ------------------------------------------------------------- |
| weightVariable | string (req) | —                | peso inicial (kg)                                             |
| targetVariable | string       | —                | peso alvo; se ausente usa `weeklyDeltaKg`                     |
| weeks          | number       | `12`             | inteiro positivo                                              |
| weeklyDeltaKg  | number       | `-0.5`           | kg/semana (negativo = perder); usado só sem `targetVariable`  |
| title          | string       | —                | título exibido                                                |

Se `weightVariable` resolve para `null`, mostra placeholder.

---

#### `stat_bars`

Par de colunas verticais (max 4) com badges e captions. Suporta interpolação `{var}` e destaque `**bold**` em `badge` e `caption`.

```json
{
  "type": "stat_bars",
  "barHeight": "10rem",
  "items": [
    { "badge": "Você",     "badgeVariant": "muted",  "percent": 40, "color": "accent",  "caption": "Baixa energia" },
    { "badge": "Com plano","badgeVariant": "accent", "percent": 92, "color": "success", "caption": "Meta em **12 semanas**" }
  ]
}
```

| prop      | tipo                | default   | obs                          |
| --------- | ------------------- | --------- | ---------------------------- |
| items     | `StatBarItem[]` 1..4| —         | req, **máximo 4**            |
| barHeight | string              | `"10rem"` | altura da área (CSS length)  |

`StatBarItem`:

| campo         | tipo                         | default    | obs                        |
| ------------- | ---------------------------- | ---------- | -------------------------- |
| badge         | string (req)                 | —          | suporta `{var}`            |
| badgeVariant  | `"muted"` \| `"accent"`      | `"muted"`  | —                          |
| percent       | number (req)                 | —          | 0..100                     |
| color         | `"accent"` \| `"success"`    | `"accent"` | —                          |
| caption       | string                       | —          | suporta `{var}` e `**bold**` |

---

### Social proof / marketing

#### `testimonial_carousel`

Carrossel de depoimentos com estrelas. Headline aceita `**destaque**`.

```json
{
  "type": "testimonial_carousel",
  "autoPlay": true,
  "intervalMs": 6000,
  "items": [
    {
      "rating": 5,
      "headline": "Perdi **10kg** em 3 meses",
      "handle": "@laragonzalez",
      "body": "O programa é super prático e adaptado à minha rotina."
    }
  ]
}
```

| prop       | tipo                 | default | obs                |
| ---------- | -------------------- | ------- | ------------------ |
| items      | `Testimonial[]` >= 1 | —       | req                |
| autoPlay   | boolean              | `false` | —                  |
| intervalMs | number               | `6000`  | > 0                |

`Testimonial`:

| campo    | tipo          | default | obs                        |
| -------- | ------------- | ------- | -------------------------- |
| rating   | number        | `5`     | 0..5                       |
| headline | string (req)  | —       | suporta `**destaque**`     |
| handle   | string        | —       | ex. `@usuario`             |
| body     | string (req)  | —       | texto corrido sem destaque |

---

#### `image_carousel`

Carrossel de imagens com dots. Bom para antes/depois.

```json
{
  "type": "image_carousel",
  "autoPlay": false,
  "aspectRatio": "4 / 3",
  "images": [
    { "src": "https://cdn/before.webp", "alt": "Antes",  "caption": "Semana 0" },
    { "src": "https://cdn/after.webp",  "alt": "Depois", "caption": "Semana 12" }
  ]
}
```

| prop         | tipo                     | default | obs            |
| ------------ | ------------------------ | ------- | -------------- |
| images       | `CarouselImage[]` >= 1   | —       | req            |
| autoPlay     | boolean                  | `false` | —              |
| intervalMs   | number                   | `4000`  | > 0            |
| aspectRatio  | string                   | —       | CSS aspect     |

`CarouselImage`: `{ src: string (req), alt?: string, caption?: string }`.

---

#### `pricing_card`

Card de preço com badge topo, preço riscado e breakdown diário (opcional).

```json
{
  "type": "pricing_card",
  "badge": "ACESSO PERMANENTE",
  "badgeColor": "#10b981",
  "planName": "VIP Plus",
  "originalPrice": "R$ 199",
  "price": "R$ 99",
  "dailyLabel": "Por dia",
  "dailyPrice": "R$ 1,33",
  "dailySuffix": "por mês"
}
```

| prop          | tipo           | default           | obs                                      |
| ------------- | -------------- | ----------------- | ---------------------------------------- |
| badge         | string (req)   | —                 | texto do badge topo                      |
| badgeColor    | string         | cor do accent     | hex (`#RGB` ou `#RRGGBB`)                |
| planName      | string (req)   | —                 | nome do plano                            |
| originalPrice | string (req)   | —                 | preço riscado (formate você: `R$ 199`)   |
| price         | string (req)   | —                 | preço final                              |
| dailyLabel    | string         | —                 | label do box diário (opcional, trio)     |
| dailyPrice    | string         | —                 | valor diário                             |
| dailySuffix   | string         | —                 | complemento (ex. `por mês`)              |

O box diário só aparece se os 3 campos (`dailyLabel`, `dailyPrice`, `dailySuffix`) estiverem presentes.

---

### Fluxo

#### `loading_screen`

Tela de "analisando…" que avança sozinha após `durationMs`. Coloque este componente **sozinho** no step (ele não combina bem com outros).

```json
{
  "type": "loading_screen",
  "text": "Analisando suas respostas...",
  "subtext": "Isso vai levar alguns segundos.",
  "durationMs": 2500,
  "variant": "spinner"
}
```

| prop       | tipo                     | default     | obs                                |
| ---------- | ------------------------ | ----------- | ---------------------------------- |
| text       | string                   | —           | título principal                   |
| subtext    | string                   | —           | subtítulo                          |
| durationMs | number                   | `3000`      | inteiro >= 0; avança após esse ms  |
| variant    | `"spinner"` \| `"bar"`   | `"spinner"` | —                                  |

---

#### `button`

CTA. **Exatamente um** de `action` ou `href` (XOR — validado).

```json
{ "type": "button", "label": "Continuar",       "action": "next",    "variant": "primary" }
{ "type": "button", "label": "Quero meu plano", "href": "https://checkout.example.com", "target": "_blank", "variant": "hero", "color": "#16A34A" }
```

| prop    | tipo                                                              | default   | obs                                                                    |
| ------- | ----------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| label   | string (req)                                                      | —         | texto do botão                                                         |
| action  | `"next"` \| `"back"`                                              | —         | obrigatório se `href` ausente                                          |
| href    | string (URL)                                                      | —         | URL absoluta válida; obrigatório se `action` ausente                   |
| target  | `"_self"` \| `"_blank"`                                           | `"_self"` | só faz sentido com `href`                                              |
| variant | `"primary"` \| `"secondary"` \| `"ghost"` \| `"hero"` \| `"raised"` | `"primary"` | visual                                                             |
| color   | string (hex)                                                      | —         | `^#[0-9a-fA-F]{3,8}$` — sobrescreve o accent **apenas deste botão**    |

**Use `href` apenas no step final do funil** — é o CTA de conversão. Nos steps intermediários use `action:"next"`.

---

#### `video_script`

Player externo (VTurb, Wistia, Vimeo, etc.) via script injetado. Avançado — use quando o briefing explicitar um VSL. **Exatamente um** de `scriptSrc` ou `inlineScript`.

```json
{
  "type": "video_script",
  "scriptSrc": "https://scripts.converteai.net/xxx/player.js",
  "playerTag": "vturb-smartplayer",
  "playerAttributes": { "id": "vid-abc123", "style": "width:100%;" },
  "aspectRatio": "16 / 9",
  "pitchSync": {
    "selector": ".pq-pitch-hidden",
    "delaySeconds": 45,
    "variants": [
      { "videoId": "vid-abc123", "delaySeconds": 45 },
      { "videoId": "vid-xyz789", "delaySeconds": 52 }
    ]
  }
}
```

| prop             | tipo                         | obs                                                                       |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------- |
| scriptSrc        | string                       | URL do script externo; dedup por URL                                      |
| inlineScript     | string                       | código JS inline; executa no slot                                         |
| containerId      | string                       | id do `<div>` gerado (se o player procura por id)                         |
| scriptAttributes | `Record<string,string>`      | atributos HTML aplicados ao `<script>`                                    |
| playerTag        | string                       | custom element (ex. `vturb-smartplayer`) renderizado no slot              |
| playerAttributes | `Record<string,string>`      | atributos do `playerTag`                                                  |
| aspectRatio      | string                       | CSS aspect (`"16 / 9"` é o normal)                                        |
| pitchSync        | objeto                       | sincroniza revelação de `hiddenUntilPitch` com o timestamp do pitch       |

`pitchSync`: exige `delaySeconds` **ou** `variants[]` (ao menos um). `variants` resolve o delay por `videoId` (para A/B testing); `delaySeconds` é fallback.

**Padrão de uso com `hiddenUntilPitch`**: no mesmo step do `video_script`, adicione `pricing_card`, `button`, `callout` etc. com `hiddenUntilPitch: true`. Eles ficam invisíveis até o player sinalizar o pitch.

---

## 10. Interpolação `{var}` e destaque `**bold**`

### Interpolação `{var}` / `{{var}}`

Substitui `{nome}` pelo valor atual da variável `nome` (converte para string; `null`/`undefined`/`""` → string vazia).

**Funciona em**:

- `heading.text`
- `stat_bars.items[].badge`
- `stat_bars.items[].caption`

**Não funciona em** (qualquer outra string renderiza literalmente):

- `text.text`, `button.label`, `callout.title/body`, `faq.*`, options de choice, `pricing_card.*`, `testimonial.body`, `image.alt`, etc.

Exemplos:
```json
{ "type": "heading", "text": "{first_name}, seu plano está pronto!" }
{ "type": "stat_bars", "items": [{ "badge": "IMC {bmi}", "percent": 60, "caption": "Meta em **12 semanas**" }] }
```

### Destaque `**bold**`

Renderiza o trecho entre `**` em accent color (cor de marca). Use com parcimônia, 1-2 palavras por texto.

**Funciona em**:

- `heading.text`
- `callout.title`, `callout.body`
- `testimonial_carousel.items[].headline`
- `stat_bars.items[].caption`

**Não funciona em** os demais (os asteriscos vão aparecer literalmente no texto).

---

## 11. Cheat sheet de validação

Falhas nestas regras fazem o Zod rejeitar o schema. A página exibe "Schema inválido" e o quiz **não roda**.

- [ ] `quiz.id`, `quiz.name` com `length >= 1`.
- [ ] `quiz.version` inteiro positivo.
- [ ] `steps.length >= 1`.
- [ ] `step.id` **únicos** no quiz.
- [ ] `step.order` inteiro `>= 0`.
- [ ] `step.analyticsKey` `length >= 1`.
- [ ] `step.progress` (se presente) entre 0 e 1.
- [ ] `step.actions.next` (se presente) aponta para um `step.id` existente.
- [ ] Todo componente tem `type` exato da lista do §9.
- [ ] `button`: tem `action` **XOR** `href` (não ambos, não nenhum).
- [ ] `button.href` (se presente) é URL válida absoluta (passa em `z.string().url()`).
- [ ] `button.color` (se presente) casa `^#[0-9a-fA-F]{3,8}$`.
- [ ] `video_script`: tem `scriptSrc` **ou** `inlineScript`.
- [ ] `video_script.pitchSync` (se presente): tem `delaySeconds` ou `variants[]` não vazio.
- [ ] `single_choice.options.length >= 1`, cada option com `value` e `label`.
- [ ] `multi_choice.options.length >= 1`.
- [ ] `stat_bars.items.length` entre 1 e 4 (**máximo 4**).
- [ ] `progress_bar.percent` entre 0 e 100.
- [ ] `stat_bars.items[].percent` entre 0 e 100.
- [ ] `testimonial.rating` (se presente) entre 0 e 5.
- [ ] `loading_screen.durationMs` (se presente) inteiro >= 0.
- [ ] `*_picker.step` (se presente) > 0.
- [ ] `image_carousel.images.length >= 1`.
- [ ] `testimonial_carousel.items.length >= 1`.
- [ ] `faq.items.length >= 1`, cada item com `question` e `answer`.
- [ ] `pricing_card`: `badge`, `planName`, `originalPrice`, `price` são obrigatórios e não vazios.
- [ ] Toda `variable` referenciada em `variable:`, `weightVariable:`, `targetVariable:`, `bmi_gauge.variable` está declarada em `variables` (não-validado pelo Zod, mas o componente renderiza em branco se faltar — evite).
- [ ] Toda `{var}` em textos aponta para uma variável declarada (senão renderiza vazio).
- [ ] Toda variável referenciada em `compute` está declarada em `variables`.

---

## 12. Templates de funil prontos

Copie, adapte, entregue. Todos passam na validação.

### 12.1 Diagnóstico de saúde/fitness (com IMC)

```json
{
  "quiz": { "id": "health-diag", "slug": "health-diag", "name": "Diagnóstico de saúde", "version": 1 },
  "theme": {
    "colors": { "bg": "0 0% 100%", "fg": "222 47% 11%", "accent": "330 81% 60%", "accentFg": "0 0% 100%", "muted": "210 40% 96%" },
    "radius": "0.75rem"
  },
  "variables": {
    "goal":           { "type": "string",   "default": null },
    "gender":         { "type": "string",   "default": null },
    "obstacles":      { "type": "string[]", "default": [] },
    "height_cm":      { "type": "number",   "default": null },
    "weight_current": { "type": "number",   "default": null },
    "first_name":     { "type": "string",   "default": "" },
    "bmi": { "type": "number", "compute": "weight_current / ((height_cm / 100) * (height_cm / 100))" }
  },
  "steps": [
    { "id": "welcome", "order": 0, "analyticsKey": "welcome",
      "components": [
        { "type": "heading", "text": "Seu plano em 2 minutos", "level": 1 },
        { "type": "text", "text": "Responda 7 perguntas rápidas para receber um plano personalizado." },
        { "type": "button", "label": "Começar", "action": "next", "variant": "primary" }
      ]
    },
    { "id": "goal", "order": 1, "analyticsKey": "goal",
      "components": [
        { "type": "heading", "text": "Qual é seu objetivo?" },
        { "type": "single_choice", "variable": "goal", "autoAdvance": true, "options": [
          { "value": "lose", "label": "Emagrecer" },
          { "value": "gain", "label": "Ganhar massa" },
          { "value": "maintain", "label": "Manter peso" },
          { "value": "tone", "label": "Definir o corpo" }
        ]}
      ]
    },
    { "id": "gender", "order": 2, "analyticsKey": "gender",
      "components": [
        { "type": "heading", "text": "Qual é seu gênero?" },
        { "type": "single_choice", "variable": "gender", "autoAdvance": true, "options": [
          { "value": "female", "label": "Feminino" },
          { "value": "male",   "label": "Masculino" }
        ]}
      ]
    },
    { "id": "obstacles", "order": 3, "analyticsKey": "obstacles",
      "components": [
        { "type": "heading", "text": "O que te impede de evoluir?" },
        { "type": "multi_choice", "variable": "obstacles", "minSelected": 1, "maxSelected": 3, "options": [
          { "value": "time",       "label": "Falta de tempo" },
          { "value": "motivation", "label": "Falta de motivação" },
          { "value": "diet",       "label": "Dificuldade com alimentação" },
          { "value": "routine",    "label": "Rotina desregulada" }
        ]}
      ]
    },
    { "id": "height", "order": 4, "analyticsKey": "height",
      "components": [
        { "type": "heading", "text": "Qual sua altura?" },
        { "type": "height_picker", "variable": "height_cm", "min": 130, "max": 220, "default": 170, "unit": "cm" }
      ]
    },
    { "id": "weight", "order": 5, "analyticsKey": "weight",
      "components": [
        { "type": "heading", "text": "Qual seu peso atual?" },
        { "type": "weight_picker", "variable": "weight_current", "min": 30, "max": 200, "default": 70, "unit": "kg" }
      ]
    },
    { "id": "name", "order": 6, "analyticsKey": "name",
      "components": [
        { "type": "heading", "text": "Como devemos te chamar?" },
        { "type": "text_input", "variable": "first_name", "placeholder": "Seu primeiro nome", "required": true, "continueLabel": "Ver resultado" }
      ]
    },
    { "id": "analyzing", "order": 7, "analyticsKey": "analyzing",
      "components": [
        { "type": "loading_screen", "text": "Analisando suas respostas...", "subtext": "Calculando seu plano ideal.", "durationMs": 2500, "variant": "bar" }
      ]
    },
    { "id": "reveal", "order": 8, "analyticsKey": "reveal",
      "components": [
        { "type": "heading", "text": "{first_name}, seu diagnóstico está pronto!" },
        { "type": "bmi_gauge", "variable": "bmi", "caption": "Seu índice de massa corporal." },
        { "type": "callout", "variant": "info", "title": "Meta em **12 semanas**", "body": "Com consistência, você chega lá." },
        { "type": "button", "label": "Quero meu plano completo", "action": "next", "variant": "hero" }
      ]
    },
    { "id": "offer", "order": 9, "analyticsKey": "offer",
      "components": [
        { "type": "heading", "text": "Oferta exclusiva" },
        { "type": "pricing_card", "badge": "ACESSO PERMANENTE", "planName": "Plano Completo", "originalPrice": "R$ 199", "price": "R$ 99", "dailyLabel": "Por dia", "dailyPrice": "R$ 0,27", "dailySuffix": "por ano" },
        { "type": "button", "label": "Quero meu plano agora", "href": "https://checkout.example.com/plan", "target": "_blank", "variant": "hero" },
        { "type": "faq", "items": [
          { "icon": "🔒", "question": "É seguro?",   "answer": "Pagamento criptografado via gateway oficial." },
          { "icon": "⏱", "question": "Demora?",      "answer": "Acesso imediato por email após o pagamento." }
        ]}
      ]
    }
  ]
}
```

### 12.2 Qualificação B2B / serviço

```json
{
  "quiz": { "id": "b2b-qualify", "slug": "b2b-qualify", "name": "Descubra seu plano", "version": 1 },
  "variables": {
    "company_size": { "type": "string", "default": null },
    "pain_points":  { "type": "string[]", "default": [] },
    "budget":       { "type": "string", "default": null },
    "name":         { "type": "string", "default": "" },
    "email":        { "type": "string", "default": "" }
  },
  "steps": [
    { "id": "welcome", "order": 0, "analyticsKey": "welcome",
      "components": [
        { "type": "heading", "text": "Vamos encontrar a solução ideal" },
        { "type": "text", "text": "Responda 4 perguntas em 1 minuto." },
        { "type": "button", "label": "Começar", "action": "next", "variant": "primary" }
      ]
    },
    { "id": "size", "order": 1, "analyticsKey": "company_size",
      "components": [
        { "type": "heading", "text": "Tamanho da sua empresa?" },
        { "type": "single_choice", "variable": "company_size", "autoAdvance": true, "options": [
          { "value": "solo",    "label": "Só eu" },
          { "value": "small",   "label": "2 a 10 pessoas" },
          { "value": "medium",  "label": "11 a 50" },
          { "value": "large",   "label": "50+" }
        ]}
      ]
    },
    { "id": "pain", "order": 2, "analyticsKey": "pain",
      "components": [
        { "type": "heading", "text": "Quais são suas maiores dores hoje?" },
        { "type": "multi_choice", "variable": "pain_points", "minSelected": 1, "options": [
          { "value": "leads",       "label": "Falta de leads qualificados" },
          { "value": "conversion",  "label": "Baixa conversão" },
          { "value": "retention",   "label": "Pouca retenção" },
          { "value": "data",        "label": "Falta de dados" }
        ]}
      ]
    },
    { "id": "budget", "order": 3, "analyticsKey": "budget",
      "components": [
        { "type": "heading", "text": "Qual seu orçamento mensal?" },
        { "type": "single_choice", "variable": "budget", "autoAdvance": true, "options": [
          { "value": "lt1k", "label": "Até R$ 1.000" },
          { "value": "1to5k", "label": "R$ 1.000 a 5.000" },
          { "value": "5to20k","label": "R$ 5.000 a 20.000" },
          { "value": "20kp",  "label": "Acima de R$ 20.000" }
        ]}
      ]
    },
    { "id": "contact", "order": 4, "analyticsKey": "contact",
      "components": [
        { "type": "heading", "text": "Quase lá! Como entramos em contato?" },
        { "type": "text_input", "variable": "name",  "label": "Seu nome", "placeholder": "Nome completo", "required": true },
        { "type": "text_input", "variable": "email", "label": "Seu email", "placeholder": "voce@empresa.com", "required": true, "continueLabel": "Receber proposta" }
      ]
    },
    { "id": "thanks", "order": 5, "analyticsKey": "thanks",
      "components": [
        { "type": "heading", "text": "Obrigado, {name}!" },
        { "type": "callout", "variant": "success", "title": "Proposta a caminho", "body": "Enviamos um plano personalizado para seu email em até **1 hora útil**." },
        { "type": "button", "label": "Agendar conversa agora", "href": "https://cal.com/agente", "target": "_blank", "variant": "hero" }
      ]
    }
  ]
}
```

### 12.3 Self-assessment (mindset/relacionamento)

```json
{
  "quiz": { "id": "mindset-check", "slug": "mindset-check", "name": "Checkup de mindset", "version": 1 },
  "variables": {
    "q1": { "type": "string", "default": null },
    "q2": { "type": "string", "default": null },
    "q3": { "type": "string", "default": null },
    "q4": { "type": "string", "default": null }
  },
  "steps": [
    { "id": "welcome", "order": 0, "analyticsKey": "welcome",
      "components": [
        { "type": "heading", "text": "Descubra seu padrão de mindset" },
        { "type": "button", "label": "Começar teste", "action": "next", "variant": "primary" }
      ]
    },
    { "id": "q1", "order": 1, "analyticsKey": "q1",
      "components": [
        { "type": "heading", "text": "Eu evito conflitos para não magoar ninguém." },
        { "type": "single_choice", "variable": "q1", "autoAdvance": true, "options": [
          { "value": "never", "label": "Nunca" },
          { "value": "rare",  "label": "Raramente" },
          { "value": "often", "label": "Frequentemente" },
          { "value": "always","label": "Sempre" }
        ]}
      ]
    },
    { "id": "q2", "order": 2, "analyticsKey": "q2",
      "components": [
        { "type": "heading", "text": "Me sinto responsável pelas emoções dos outros." },
        { "type": "single_choice", "variable": "q2", "autoAdvance": true, "options": [
          { "value": "never", "label": "Nunca" },
          { "value": "rare",  "label": "Raramente" },
          { "value": "often", "label": "Frequentemente" },
          { "value": "always","label": "Sempre" }
        ]}
      ]
    },
    { "id": "q3", "order": 3, "analyticsKey": "q3",
      "components": [
        { "type": "heading", "text": "Tenho dificuldade para dizer não." },
        { "type": "single_choice", "variable": "q3", "autoAdvance": true, "options": [
          { "value": "never", "label": "Nunca" },
          { "value": "rare",  "label": "Raramente" },
          { "value": "often", "label": "Frequentemente" },
          { "value": "always","label": "Sempre" }
        ]}
      ]
    },
    { "id": "q4", "order": 4, "analyticsKey": "q4",
      "components": [
        { "type": "heading", "text": "Coloco minhas necessidades em segundo plano." },
        { "type": "single_choice", "variable": "q4", "autoAdvance": true, "options": [
          { "value": "never", "label": "Nunca" },
          { "value": "rare",  "label": "Raramente" },
          { "value": "often", "label": "Frequentemente" },
          { "value": "always","label": "Sempre" }
        ]}
      ]
    },
    { "id": "loading", "order": 5, "analyticsKey": "loading",
      "components": [
        { "type": "loading_screen", "text": "Analisando seu perfil...", "durationMs": 2000, "variant": "spinner" }
      ]
    },
    { "id": "result", "order": 6, "analyticsKey": "result",
      "components": [
        { "type": "heading", "text": "Seu perfil: **codependência emocional**" },
        { "type": "callout", "variant": "warning", "title": "O que isso significa?", "body": "Você cuida dos outros antes de si. Sem consciência, isso leva ao esgotamento." },
        { "type": "stat_bars", "items": [
          { "badge": "Hoje",        "badgeVariant": "muted",  "percent": 30, "color": "accent",  "caption": "Satisfação pessoal" },
          { "badge": "Com o plano", "badgeVariant": "accent", "percent": 85, "color": "success", "caption": "Em **8 semanas**" }
        ]},
        { "type": "button", "label": "Quero me transformar", "href": "https://checkout.example.com/mindset", "variant": "hero" }
      ]
    }
  ]
}
```

### 12.4 Funil com VSL (info-produto)

Use quando o pitch é assistir a um vídeo e o CTA só aparece depois do pitch.

```json
{
  "quiz": { "id": "vsl-launch", "slug": "vsl-launch", "name": "Método X", "version": 1 },
  "variables": {
    "experience": { "type": "string", "default": null },
    "struggle":   { "type": "string[]", "default": [] }
  },
  "steps": [
    { "id": "welcome", "order": 0, "analyticsKey": "welcome",
      "components": [
        { "type": "heading", "text": "Descubra o método X" },
        { "type": "button", "label": "Começar", "action": "next", "variant": "primary" }
      ]
    },
    { "id": "experience", "order": 1, "analyticsKey": "experience",
      "components": [
        { "type": "heading", "text": "Qual sua experiência?" },
        { "type": "single_choice", "variable": "experience", "autoAdvance": true, "options": [
          { "value": "none",   "label": "Nunca tentei" },
          { "value": "some",   "label": "Já tentei algumas vezes" },
          { "value": "expert", "label": "Já sou avançado" }
        ]}
      ]
    },
    { "id": "struggle", "order": 2, "analyticsKey": "struggle",
      "components": [
        { "type": "heading", "text": "O que mais atrapalha você?" },
        { "type": "multi_choice", "variable": "struggle", "minSelected": 1, "options": [
          { "value": "time",       "label": "Falta de tempo" },
          { "value": "know",       "label": "Não sei por onde começar" },
          { "value": "motivation", "label": "Falta de motivação" }
        ]}
      ]
    },
    { "id": "loading", "order": 3, "analyticsKey": "loading",
      "components": [ { "type": "loading_screen", "text": "Preparando seu vídeo...", "durationMs": 2000 } ]
    },
    { "id": "pitch", "order": 4, "analyticsKey": "pitch",
      "components": [
        { "type": "heading", "text": "Assista ao vídeo até o final:" },
        {
          "type": "video_script",
          "scriptSrc": "https://scripts.converteai.net/ID/player.js",
          "playerTag": "vturb-smartplayer",
          "playerAttributes": { "id": "vid-main", "style": "width:100%;" },
          "aspectRatio": "16 / 9",
          "pitchSync": { "selector": ".pq-pitch-hidden", "delaySeconds": 480 }
        },
        { "type": "pricing_card", "hiddenUntilPitch": true, "badge": "OFERTA LIMITADA", "planName": "Método X Completo", "originalPrice": "R$ 497", "price": "R$ 197" },
        { "type": "button", "hiddenUntilPitch": true, "label": "Quero entrar agora", "href": "https://checkout.example.com/method-x", "variant": "hero" },
        { "type": "faq", "hiddenUntilPitch": true, "items": [
          { "icon": "🔒", "question": "Pagamento seguro?", "answer": "100% criptografado." },
          { "icon": "⏱", "question": "Acesso imediato?",   "answer": "Sim, via email após pagamento." }
        ]}
      ]
    }
  ]
}
```

---

## 13. Tradução de screenshots → componentes

Ao analisar um print de funil, use esta tabela para mapear o que vê visualmente para o `type` correto:

| O que aparece no print                                             | Componente(s)                              | Dicas                                         |
| ------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------- |
| Tela inicial com título grande, subtítulo e botão centrado         | `heading` + `text` + `button action:"next"` | Geralmente `level: 1`                         |
| Pergunta + grid 2 colunas com foto e label                         | `heading` + `single_choice` `imageLayout:"grid"` | `autoAdvance: true` é o natural           |
| Pergunta + lista vertical com thumb à esquerda                     | `heading` + `single_choice` `imageLayout:"prepend"` | —                                      |
| Pergunta + opções simples (texto, 1 por linha)                     | `heading` + `single_choice`                | sem `imageSrc` nas options                    |
| Checkbox multi-seleção + botão "Continuar"                         | `heading` + `multi_choice`                 | defina `minSelected`, `maxSelected` se visível |
| Stepper com −/+ para altura/peso/idade, valor grande               | `height_picker` / `weight_picker` / `age_picker` | escolha pelo `unit` exibido             |
| Input texto com label "Qual seu nome?" / "Email"                   | `text_input`                               | `required: true` se for obrigatório           |
| Input numérico com validação                                       | `number_input`                             | defina `min`/`max` se inferível               |
| "Analisando suas respostas..." com spinner ou barra                | `loading_screen`                           | variant `spinner` (default) ou `bar`          |
| Gauge/velocímetro colorido com faixas (Baixo/Normal/Alto)          | `bmi_gauge`                                | exige `variable` numérica (calculada)         |
| Gráfico de linha/área com projeção de perda de peso                | `progress_chart`                           | exige `weightVariable`; opcional `targetVariable` |
| Barra horizontal "Taxa de sucesso: 96%"                            | `progress_bar`                             | `percent` literal; `label`                    |
| 2 barras verticais comparativas ("Você" vs "Com plano")            | `stat_bars`                                | máx 4 items                                   |
| Card colorido (verde ✓ / amarelo ⚠ / vermelho ✗) com título+texto  | `callout`                                  | variant por semântica                         |
| Carrossel de fotos antes/depois                                    | `image_carousel`                           | `captions` são úteis                          |
| Carrossel de depoimentos com estrelas                              | `testimonial_carousel`                     | `rating` 0..5                                 |
| Card de preço com valor riscado e valor novo                       | `pricing_card`                             | preencha `originalPrice` e `price` como strings formatadas |
| Vídeo VSL com pricing/botão que surgem depois                      | `video_script` + demais com `hiddenUntilPitch:true` | `pitchSync.delaySeconds` em segundos |
| "Perguntas frequentes" com ícones                                  | `faq`                                      | `icon` é emoji                                |
| Botão "Comprar" / "Quero meu plano" no step final                  | `button href:"..."`                        | `target:"_blank"` se abrir em nova aba        |
| Imagem decorativa (hero, ilustração)                               | `image`                                    | use `aspectRatio` se a proporção importa      |

**Dicas gerais ao analisar prints**:

- Sempre comece cada step com um `heading` (mesmo que pequeno). Usuários perdem contexto sem ele.
- Se o print mostra uma barra de progresso no topo — **não** declare no JSON. O runtime adiciona automaticamente.
- Se mostra um botão de voltar no canto — **não** declare. Também é automático (exceto no primeiro step).
- Se a tela tem apenas um `single_choice` grande ocupando tudo — use `autoAdvance: true` (padrão).
- Se o print é um step de "reveal" com vários elementos (gauge + gráfico + callout + CTA), coloque todos como componentes no mesmo step, na ordem vertical.
- Se você não reconhece um componente na lista, **não invente**. Aproxime com o componente mais próximo (ex. para "slider avaliativo" use `single_choice` com valores "1", "2", "3", "4", "5").

---

## 14. Convenções de nomenclatura

- **`quiz.id` e `slug`**: kebab-case (`treino-em-casa-es`, `method-x-launch`). O nome do arquivo é `<slug>.json`.
- **`step.id`**: snake_case descritivo (`welcome`, `goal`, `height`, `reveal`, `pitch`, `offer`, `thanks`). Evite numeração (`step-1`, `step-2`); se mudar a ordem, os analytics quebram.
- **`analyticsKey`**: snake_case, geralmente igual ao `step.id` ou sua versão simplificada. **Nunca mude** entre versões.
- **`variables` keys**: snake_case descritivo (`weight_current`, `height_cm`, `first_name`). Evite abreviações (`wt`, `h`, `n`).
- **`option.value`**: snake_case curto, estável (`lose`, `gain`, `female`, `male`). É o dado que chega no analytics.
- **`option.label`**: texto natural na língua do usuário ("Emagrecer", "Ganhar massa").

---

## 15. Checklist pré-entrega

Antes de entregar o JSON, verifique:

- [ ] `quiz.id`, `quiz.name`, `quiz.version` presentes e válidos.
- [ ] `steps` tem pelo menos 1 item.
- [ ] Todos os `step.id` são únicos.
- [ ] Cada `step` tem `order` inteiro >= 0, sequencial.
- [ ] Cada `step` tem `analyticsKey` descritivo.
- [ ] Todos os `actions.next` (se usados) referenciam step existente.
- [ ] Todo `type` de componente consta no §9 (22 tipos exatos).
- [ ] Toda `variable` usada (em `variable:`, `weightVariable:`, `targetVariable:`, `bmi_gauge.variable`) está declarada em `variables`.
- [ ] Toda `{var}` em textos aponta para uma variável declarada.
- [ ] Toda referência em `compute` aponta para uma variável declarada.
- [ ] `compute` só usa `+ - * / ( )` e identificadores.
- [ ] Todo `button` tem `action` XOR `href`.
- [ ] Todo `button.href` é URL absoluta válida (`https://...`).
- [ ] `button.color` (se presente) é hex válido (`#RGB` ou `#RRGGBB`).
- [ ] `video_script` tem `scriptSrc` ou `inlineScript` (não ambos, não nenhum).
- [ ] `video_script.pitchSync` (se presente) tem `delaySeconds` ou `variants[]`.
- [ ] `stat_bars.items.length` <= 4.
- [ ] `percent` (em `progress_bar` e `stat_bars`) está em 0..100.
- [ ] `testimonial.rating` (se presente) está em 0..5.
- [ ] `single_choice`/`multi_choice.options` tem pelo menos 1 item com `value` e `label`.
- [ ] Cores do theme em **HSL sem wrapper** (`"330 81% 60%"`), nunca hex/rgb.
- [ ] Todas as URLs de imagem são absolutas e acessíveis.
- [ ] O último step tem um botão com `href` (checkout externo) OU é o step final linear.
- [ ] O JSON é valido (parseavel por `JSON.parse`) — sem comentários, sem trailing commas.

---

## 16. Snippet de quiz mínimo válido

O menor quiz que passa na validação e roda:

```json
{
  "quiz": { "id": "hello", "slug": "hello", "name": "Hello", "version": 1 },
  "steps": [
    {
      "id": "welcome",
      "order": 0,
      "analyticsKey": "welcome",
      "components": [
        { "type": "heading", "text": "Olá!" },
        { "type": "button", "label": "Ver mais", "href": "https://example.com", "variant": "primary" }
      ]
    }
  ]
}
```

---

## 17. Snippet de quiz rico

Versão ilustrativa exercitando a maioria dos componentes visuais. Use como referência; adapte livremente.

```json
{
  "quiz": { "id": "showcase", "slug": "showcase", "name": "Showcase", "version": 1 },
  "theme": {
    "colors": { "bg": "0 0% 100%", "fg": "222 47% 11%", "accent": "330 81% 60%", "accentFg": "0 0% 100%", "muted": "210 40% 96%" },
    "radius": "0.75rem"
  },
  "variables": {
    "name":           { "type": "string",   "default": "" },
    "goal":           { "type": "string",   "default": null },
    "obstacles":      { "type": "string[]", "default": [] },
    "height_cm":      { "type": "number",   "default": 170 },
    "weight_current": { "type": "number",   "default": 70 },
    "weight_target":  { "type": "number",   "default": 62 },
    "age":            { "type": "number",   "default": 30 },
    "bmi": { "type": "number", "compute": "weight_current / ((height_cm / 100) * (height_cm / 100))" }
  },
  "steps": [
    { "id": "welcome", "order": 0, "analyticsKey": "welcome",
      "components": [
        { "type": "image", "src": "https://picsum.photos/seed/hero/640/320", "alt": "Capa", "aspectRatio": "2 / 1" },
        { "type": "heading", "text": "Seu plano em **2 minutos**", "level": 1 },
        { "type": "text", "text": "Responda 6 perguntas rápidas." },
        { "type": "button", "label": "Começar", "action": "next", "variant": "primary" }
      ]
    },
    { "id": "name", "order": 1, "analyticsKey": "name",
      "components": [
        { "type": "heading", "text": "Como devemos te chamar?" },
        { "type": "text_input", "variable": "name", "placeholder": "Seu nome", "required": true, "continueLabel": "Continuar" }
      ]
    },
    { "id": "goal", "order": 2, "analyticsKey": "goal",
      "components": [
        { "type": "heading", "text": "Qual seu objetivo?" },
        { "type": "single_choice", "variable": "goal", "autoAdvance": true, "imageLayout": "grid", "options": [
          { "value": "lose",     "label": "Emagrecer",    "imageSrc": "https://picsum.photos/seed/lose/240/240" },
          { "value": "gain",     "label": "Ganhar massa", "imageSrc": "https://picsum.photos/seed/gain/240/240" },
          { "value": "maintain", "label": "Manter peso",  "imageSrc": "https://picsum.photos/seed/maintain/240/240" },
          { "value": "tone",     "label": "Definir",      "imageSrc": "https://picsum.photos/seed/tone/240/240" }
        ]}
      ]
    },
    { "id": "obstacles", "order": 3, "analyticsKey": "obstacles",
      "components": [
        { "type": "heading", "text": "O que te atrapalha?" },
        { "type": "multi_choice", "variable": "obstacles", "minSelected": 1, "maxSelected": 3, "options": [
          { "value": "time",       "label": "Falta de tempo" },
          { "value": "motivation", "label": "Falta de motivação" },
          { "value": "diet",       "label": "Alimentação" },
          { "value": "routine",    "label": "Rotina" }
        ]}
      ]
    },
    { "id": "measures", "order": 4, "analyticsKey": "measures",
      "components": [
        { "type": "heading", "text": "Suas medidas" },
        { "type": "height_picker", "variable": "height_cm",      "min": 130, "max": 220, "unit": "cm" },
        { "type": "weight_picker", "variable": "weight_current", "min": 30,  "max": 200, "unit": "kg" },
        { "type": "age_picker",    "variable": "age",            "min": 13,  "max": 90,  "unit": "anos" }
      ]
    },
    { "id": "analyzing", "order": 5, "analyticsKey": "analyzing",
      "components": [
        { "type": "loading_screen", "text": "Calculando seu plano...", "subtext": "Um instante.", "durationMs": 2500, "variant": "bar" }
      ]
    },
    { "id": "reveal", "order": 6, "analyticsKey": "reveal",
      "components": [
        { "type": "heading", "text": "{name}, aqui está seu diagnóstico!" },
        { "type": "bmi_gauge", "variable": "bmi", "caption": "Seu IMC atual" },
        { "type": "progress_chart", "weightVariable": "weight_current", "targetVariable": "weight_target", "weeks": 12, "title": "Sua projeção" },
        { "type": "stat_bars", "items": [
          { "badge": "Hoje",    "badgeVariant": "muted",  "percent": 40, "color": "accent",  "caption": "Energia atual" },
          { "badge": "12 sem.", "badgeVariant": "accent", "percent": 88, "color": "success", "caption": "Com o **plano**" }
        ]},
        { "type": "callout", "variant": "success", "title": "Você pode chegar lá", "body": "Resultado em **12 semanas** com 20 min/dia." },
        { "type": "progress_bar", "percent": 96, "color": "success", "label": "Taxa de sucesso" },
        { "type": "testimonial_carousel", "autoPlay": true, "intervalMs": 5000, "items": [
          { "rating": 5, "headline": "Perdi **8 kg** em 2 meses", "handle": "@lara",   "body": "Muito prático e sem dietas loucas." },
          { "rating": 5, "headline": "Recuperei minha **autoestima**", "handle": "@paulo", "body": "Consegui seguir mesmo com rotina corrida." }
        ]},
        { "type": "image_carousel", "aspectRatio": "4 / 3", "images": [
          { "src": "https://picsum.photos/seed/before/480/360", "caption": "Antes" },
          { "src": "https://picsum.photos/seed/after/480/360",  "caption": "12 semanas depois" }
        ]},
        { "type": "button", "label": "Quero meu plano completo", "action": "next", "variant": "hero" }
      ]
    },
    { "id": "offer", "order": 7, "analyticsKey": "offer",
      "components": [
        { "type": "heading", "text": "Oferta especial para você" },
        { "type": "pricing_card", "badge": "ACESSO VITALÍCIO", "badgeColor": "#10b981", "planName": "Plano Completo", "originalPrice": "R$ 297", "price": "R$ 97", "dailyLabel": "Por dia", "dailyPrice": "R$ 0,27", "dailySuffix": "no 1º ano" },
        { "type": "button", "label": "Quero agora", "href": "https://checkout.example.com/offer", "target": "_blank", "variant": "hero" },
        { "type": "faq", "items": [
          { "icon": "🔒", "question": "É seguro?",        "answer": "Pagamento processado com criptografia." },
          { "icon": "⏱", "question": "Acesso imediato?", "answer": "Sim, enviamos por email em segundos." },
          { "icon": "↩",  "question": "Tem garantia?",    "answer": "7 dias, sem perguntas." }
        ]}
      ]
    }
  ]
}
```

---

## 18. Anti-padrões (evite)

Coisas que agentes tentam fazer e **quebram o quiz**:

### 18.1 Inventar `type` que não existe
```json
{ "type": "video",        ... }  // ❌ — use "video_script"
{ "type": "email_input",  ... }  // ❌ — use "text_input"
{ "type": "slider",       ... }  // ❌ — use "single_choice" com valores numéricos ou um `*_picker`
{ "type": "date_picker",  ... }  // ❌ — não existe; use "text_input" ou 3x "single_choice"
{ "type": "radio",        ... }  // ❌ — use "single_choice"
```

### 18.2 Expressões não aritméticas em `compute`
```json
"compute": "Math.round(weight / 2)"             // ❌ funções não permitidas
"compute": "goal === 'lose' ? 1 : 0"            // ❌ ternário/comparação não permitidos
"compute": "weight > 70"                        // ❌ comparação não permitida
"compute": "scores[0] + scores[1]"              // ❌ acesso a array não permitido
"compute": "weight * 2.2 + 10"                  // ✅ OK
```

### 18.3 Declarar tracking no schema
```json
"tracking": { ... }                      // ❌ campo não existe
"events": [ ... ]                        // ❌ idem
"step.events": [ ... ]                   // ❌ idem
```

Tracking é 100% automático.

### 18.4 Theme em formato errado
```json
"theme": { "colors": { "accent": "#E91E63" } }            // ❌ hex não suportado
"theme": { "colors": { "accent": "hsl(330 81% 60%)" } }    // ❌ wrapper não suportado
"theme": { "colors": { "accent": "330 81% 60%" } }         // ✅ correto
```

### 18.5 Skip logic condicional
```json
"actions": { "next": "{goal === 'lose' ? 'step-lose' : 'step-gain'}" }   // ❌ não existe
"actions": { "nextIf": { "goal": "lose", "target": "step-lose" } }       // ❌ campo não existe
```

Não há condicional no schema. Mantenha o funil linear ou use um mesmo step com interpolação `{var}`.

### 18.6 Botão com `action` e `href` ao mesmo tempo
```json
{ "type": "button", "label": "X", "action": "next", "href": "https://..." }   // ❌ XOR
```

### 18.7 Esquecer `analyticsKey` ou `order`
Ambos são obrigatórios em todo step.

### 18.8 `compute` referenciando variável não declarada
```json
"variables": {
  "bmi": { "type": "number", "compute": "w / (h * h)" }
}
// ❌ w e h não estão declaradas. Retorna null silenciosamente — o gauge fica vazio.
```

### 18.9 Interpolação/destaque fora dos campos suportados
```json
{ "type": "text", "text": "Olá, {name}!" }                // ⚠ renderiza literalmente "{name}" — interpolação só em heading/stat_bars
{ "type": "button", "label": "Continuar **agora**" }      // ⚠ asteriscos aparecem literalmente
```

### 18.10 URLs relativas em imagens/hrefs
```json
{ "type": "image",  "src": "/img/hero.png" }               // ❌ use URL absoluta
{ "type": "button", "href": "/checkout" }                  // ❌ falha em `z.string().url()`
{ "type": "image",  "src": "https://cdn.example.com/hero.webp" } // ✅
```

### 18.11 Comentários ou trailing commas no JSON
```json
{
  "quiz": { /* meu quiz */ },     // ❌ JSON não aceita comentários
  "steps": [ ... ],               // ❌ trailing comma quebra o parser
}
```

---

## FIM

Este documento é autossuficiente. Se algo não consta aqui, **não existe** no schema. Em caso de dúvida entre duas interpretações, escolha a mais simples e conservadora — gere o JSON mais próximo do snippet mínimo (§16) que ainda entrega o funil pedido.
