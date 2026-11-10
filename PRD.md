# PRD — Quiz Runtime + Analytics Dashboard

## Projeto interno de clonagem de funis com base no quiz de referência (treino em casa)

## 1. Resumo executivo

O produto é uma aplicação web interna para **renderizar quizzes/funis via JSON/schema**, com **componentes visuais reutilizáveis**, **métricas próprias de funil** e **integração com GTM**, começando pelo clone fiel do quiz de referência do quiz de referência.

A prioridade da v1 é:

1. **velocidade de lançamento**
2. **acurácia de métricas**
3. **fidelidade visual/funcional do quiz atual**
4. **arquitetura que permita futuras clonagens e evolução para engine de funis com IA**

A primeira versão **não será um SaaS** e **não terá builder visual**. O foco é entregar um runtime sólido, analytics confiável e um primeiro funil clonado em produção.

---

## 2. Contexto do problema

Hoje o quiz opera em uma plataforma externa que resolve parte importante do problema, mas traz limitações técnicas e estratégicas:

- dependência de terceiros
- limitação no carregamento de vídeos por script
- menor liberdade de evolução técnica
- dificuldade de transformar o processo em um ativo interno reaproveitável
- ausência de base própria para evoluir futuramente para clonagem assistida por IA e geração de novos funis

Ao mesmo tempo, a plataforma atual faz muito bem algo que é crítico para o negócio: **métricas do funil**, em especial:

- visitas
- interações/inícios
- taxa de interação
- passagem por etapa
- queda ao longo do quiz
- comparação entre períodos
- separação por origem de tráfego

O novo produto precisa preservar esse valor e ampliar a flexibilidade técnica.

---

## 3. Objetivo do produto

Construir um sistema interno que permita:

- clonar e operar o quiz atual com fidelidade
- medir a eficiência do quiz com precisão
- ter controle total sobre renderização, tracking e extensibilidade
- servir como base de uma futura engine de funis/clonagem por IA

---

## 4. Objetivos da v1

### Objetivos principais

- clonar o quiz de referência (treino em casa) em React + TypeScript
- renderizar o funil via schema JSON
- suportar os componentes necessários do quiz atual
- persistir sessão e permitir retomada automática por até 24h
- registrar analytics próprios no Supabase
- disponibilizar dashboard interno para o time de CRO
- integrar GTM
- suportar vídeo via script renderizado no local correto do componente

### Objetivos secundários

- estruturar os dados e componentes para permitir futuras clonagens rápidas
- deixar a arquitetura pronta para futura automação via crawler + IA

---

## 5. Não objetivos da v1

Esta versão **não** terá:

- builder visual drag-and-drop
- múltiplos workspaces
- editor visual de quiz
- ramificações complexas
- armazenamento completo de todas as respostas do usuário
- integrações nativas com checkout
- otimização automática por IA em produção
- criação autônoma de novos quizzes por IA

---

## 6. Usuários

### Usuário principal

**Time de CRO (Conversion Rate Optimization)**

Esse time precisa:

- acompanhar performance do funil
- identificar drop-offs
- comparar períodos
- medir eficiência de cada etapa
- validar variações futuras

### Usuários secundários

- time técnico interno
- operação de marketing/performance
- time responsável por futuras clonagens

---

## 7. Escopo funcional da v1

A v1 terá três blocos principais:

### A. Runtime de quiz

Responsável por renderizar o funil com base em schema.

### B. Tracking e analytics

Responsável por registrar eventos, consolidar métricas e alimentar o dashboard.

### C. Dashboard interno

Responsável por exibir a performance do quiz por período e por origem.

---

# 8. Requisitos funcionais

## 8.1 Runtime de quiz por schema

O sistema deverá renderizar quizzes com base em um schema JSON estruturado.

Cada quiz terá:

- metadados do quiz
- tema/estilo
- sequência de etapas
- definição de componentes por etapa
- bindings de variáveis
- regras de navegação
- metadados analíticos por etapa

### Requisito

O runtime deve ser genérico o suficiente para que novos quizzes possam ser criados por duplicação e edição de schema, sem necessidade de reescrever o app.

---

## 8.2 Clone fiel do quiz de referência (treino em casa)

A primeira implementação deverá reproduzir com alta fidelidade:

- estrutura de 35 etapas
- progress bar
- comportamento do botão voltar
- ordem do funil
- inputs e interações
- gráficos animados
- carrossel de imagens
- telas de loading/análise
- etapa final com vídeo
- CTA final para checkout externo

### Observação

A fidelidade visual final dependerá também da extração dos assets e da copy exata, mas o produto deve nascer pronto para isso.

---

## 8.3 Componentes suportados no MVP

O runtime deve suportar os componentes necessários para o quiz atual:

- texto
- título/subtítulo
- imagem
- botão CTA
- cards de escolha com imagem
- single choice
- multi choice
- input de texto
- input numérico
- seletor de altura/peso/idade
- barra de progresso
- gráfico animado
- carrossel de imagens
- tela de loading/análise
- componente de vídeo via script
- CTA final com link externo
- toast/notificação para retomada de sessão

---

## 8.4 Variáveis e cálculos

O sistema deve permitir capturar apenas as respostas estritamente necessárias para personalização e cálculo.

### Casos confirmados para a v1

- nome
- idade
- altura
- peso atual
- peso meta
- IMC calculado
- dados usados para gráfico da etapa de análise

### Requisito

O cálculo deve ser simples, determinístico e realizado no cliente, com persistência mínima da sessão.

### Não requisito

Salvar o histórico completo de respostas de todas as etapas.

---

## 8.5 Navegação

### Regras da v1

- fluxo linear
- sem ramificações condicionais
- sem etapas opcionais
- com botão voltar
- com progress bar real
- com retomada automática de sessão por 24h

### Retomada de sessão

Se o usuário retornar dentro da janela de 24h:

- o quiz deve reabrir no ponto em que ele parou
- deve aparecer uma notificação informando que ele está continuando de onde parou
- não haverá modal de confirmação

---

## 8.6 Vídeo via script no slot correto

Um requisito central é suportar vídeo carregado por script, renderizado **exatamente dentro do componente onde ele foi colocado**, e não no fim da página.

### Requisito técnico

O componente de vídeo deve:

- aceitar script/embed configurável no schema
- montar/desmontar corretamente
- preservar o layout da etapa
- funcionar com re-render controlado
- evitar duplicação do script ao navegar de volta e avançar novamente

---

## 8.7 Integração com GTM

O quiz deverá integrar com Google Tag Manager.

### Regras

- o GTM será embutido no quiz
- os pixels/terceiros serão geridos via GTM
- o sistema próprio continuará sendo a fonte oficial das métricas do quiz

### Importante

As métricas do dashboard interno não devem depender do GTM para existir.

---

## 8.8 Checkout externo

A última etapa possui um botão que leva para checkout externo.

### Regras

- o checkout final é sempre o mesmo
- a métrica final do quiz será o clique no botão final
- tracking do comportamento pós-clique não faz parte do escopo principal da v1

---

# 9. Requisitos de analytics

## 9.1 Definições oficiais de métricas

### Visita

Usuário carregou a primeira etapa do quiz.

### Interação / início

Usuário avançou da primeira etapa para a segunda

ou respondeu a primeira pergunta/acionou o primeiro CTA que o tira da etapa inicial.

Se o usuário apenas abriu e fechou a página, conta como visita, mas **não** conta como interação.

### Taxa de interação

`interações / visitas`

### Conversão acumulada por etapa

Cada etapa terá a métrica principal calculada como:

`número de sessões únicas que chegaram/avançaram até aquela etapa / número total de interações`

Exemplo:

- Etapa 1 = 100%
- Etapa 2 = 97%
- Etapa 3 = 96%

### Total por etapa

O dashboard também mostrará o número absoluto de sessões únicas que alcançaram cada etapa.

### Última etapa

A métrica final é:

`cliques únicos no botão final / interações`

---

## 9.2 Deduplicação

As métricas principais devem contar **uma única vez por sessão**.

### Exemplo

Se a pessoa:

- chega na etapa 5
- volta para a 4
- chega de novo na 5

A etapa 5 deve contar apenas **uma vez** nas métricas principais.

---

## 9.3 Janela temporal e timezone

Timezone oficial:

**America/Sao_Paulo**

O dashboard deve suportar:

- hoje
- ontem
- últimos 7 dias
- intervalo customizado

Também deve permitir:

- comparação com período anterior equivalente

Exemplo:

- últimos 7 dias vs 7 dias anteriores
- ontem vs anteontem
- data customizada vs período imediatamente anterior da mesma duração

---

## 9.4 Segmentação por origem

O dashboard deve permitir visualizar métricas por:

### Primário

- `utm_source`

### Fallback

Na ausência de UTM, usar:

1. `document.referrer` normalizado
2. se vazio, classificar como `direct`

### Dados adicionais a armazenar

- device
- country

Na v1, eles podem ser armazenados sem necessariamente entrar como filtro principal do dashboard.

---

## 9.5 Tráfego inválido

Bots e crawlers devem ser ignorados sempre que possível.

### Casos importantes

- bots conhecidos
- crawlers de prévia
- validadores de link
- checagens automáticas do Facebook/Meta sobre landing page

### Estratégia

Toda sessão/evento deve carregar sinalização de qualidade de tráfego, para que o pipeline analítico exclua tráfego inválido do dashboard principal.

---

# 10. Eventos obrigatórios da v1

Eventos oficiais:

- `quiz_visit`
- `quiz_start`
- `step_view`
- `step_advance`
- `step_back`
- `quiz_resume`
- `quiz_complete_cta_click`

### Observações

- `quiz_visit` ocorre no carregamento da etapa inicial
- `quiz_start` ocorre na primeira transição válida que tira o usuário da etapa inicial
- `step_view` registra entrada em uma etapa
- `step_advance` registra avanço para a próxima
- `step_back` registra navegação reversa
- `quiz_resume` registra retomada automática de sessão
- `quiz_complete_cta_click` registra clique final

---

# 11. Requisitos não funcionais

## 11.1 Performance

O quiz deve carregar rápido e ser leve.

### Metas qualitativas

- primeira dobra rápida
- progressão fluida entre etapas
- baixa latência percebida
- tracking não pode bloquear navegação

### Direção técnica

- app hospedado na Vercel
- assets otimizados
- lazy loading quando fizer sentido
- envio de eventos com prioridade baixa e mecanismo resiliente

---

## 11.2 Confiabilidade de tracking

Analytics é requisito de produto, não detalhe técnico.

### Requisitos

- tracking resistente a fechamento de aba
- baixo risco de perda de eventos críticos
- envio assíncrono
- idempotência no backend quando necessário

### Direção técnica

Usar `navigator.sendBeacon` quando possível para eventos críticos, com fallback para `fetch(..., keepalive: true)`.

---

## 11.3 Segurança

- autenticação via Supabase Auth para dashboard interno
- runtime público do quiz separado da área autenticada
- políticas RLS no banco
- edge functions protegidas conforme contexto
- dados mínimos de sessão, sem coleta excessiva de PII

---

## 11.4 Manutenibilidade

A arquitetura deve facilitar:

- clonagem de novos funis
- evolução dos componentes
- futura automação por crawler + IA
- experimentação visual futura

---

# 12. Arquitetura proposta

## 12.1 Stack

### Frontend

- React
- TypeScript
- Vercel

### Backend / dados

- Supabase
- Postgres
- Supabase Auth
- Edge Functions

### Tracking/terceiros

- Google Tag Manager

---

## 12.2 Macroarquitetura

### Camada 1 — Public Quiz Runtime

Responsável por:

- carregar schema
- renderizar etapas
- calcular variáveis locais
- persistir sessão
- disparar eventos para backend

### Camada 2 — Analytics Ingestion

Responsável por:

- receber eventos
- validar payload
- classificar tráfego
- deduplicar quando necessário
- persistir eventos e agregados

### Camada 3 — Metrics Read Model

Responsável por:

- consolidar métricas de dashboard
- servir comparações por período
- responder filtros e breakdowns

### Camada 4 — Internal Dashboard

Responsável por:

- autenticação
- filtros de data
- visão geral
- funil por etapa
- breakdown por source/origin

---

# 13. Modelo de domínio

## 13.1 Entidades principais

### Quiz

Representa um funil configurável.

Campos sugeridos:

- `id`
- `slug`
- `name`
- `status`
- `version`
- `schema_json`
- `created_at`
- `updated_at`

### Quiz Step

Pode ficar embutido no schema, mas conceitualmente representa cada etapa.

Campos conceituais:

- `step_id`
- `order_index`
- `type`
- `title`
- `analytics_key`
- `components`

### Quiz Session

Representa a sessão do visitante.

Campos sugeridos:

- `id`
- `quiz_id`
- `session_token`
- `started_at`
- `last_seen_at`
- `resumed_at`
- `current_step_id`
- `is_started`
- `is_completed`
- `utm_source`
- `origin`
- `device_type`
- `country`
- `traffic_quality`
- `expires_at`

### Quiz Event

Representa um evento analítico.

Campos sugeridos:

- `id`
- `quiz_id`
- `session_id`
- `event_name`
- `step_id`
- `step_order`
- `event_ts`
- `payload_json`
- `utm_source`
- `origin`
- `device_type`
- `country`
- `traffic_quality`

### Quiz Step Aggregate

Tabela/materialized view para leitura rápida.

Campos sugeridos:

- `quiz_id`
- `date_bucket`
- `step_id`
- `step_order`
- `unique_sessions_reached`
- `unique_sessions_advanced`
- `unique_sessions_back`
- `unique_final_clicks`
- `utm_source`
- `origin`

# 14. Estrutura proposta do schema do quiz

O schema deve ser a verdade principal do runtime.

## Exemplo conceitual

```
{
  "quiz": {
    "id":"treino-em-casa-v1",
    "name":"Treino em Casa Quiz",
    "version":1,
    "theme": {
      "colors": {},
      "fonts": {},
      "spacing": {},
      "radius": {}
    }
  },
  "variables": {
    "name": { "type":"string", "default":"" },
    "age": { "type":"number", "default":null },
    "height_cm": { "type":"number", "default":null },
    "weight_current": { "type":"number", "default":null },
    "weight_goal": { "type":"number", "default":null },
    "bmi": {
      "type":"number",
      "compute":"weight_current / ((height_cm / 100) * (height_cm / 100))"
    }
  },
  "steps": [
    {
      "id":"step-01",
      "order":1,
      "analytics_key":"landing",
      "progress":0.03,
      "components": [],
      "actions": {
        "next":"step-02"
      }
    }
  ]
}
```

## Requisito

O schema deve suportar:

- componentes por etapa
- variáveis capturadas
- cálculos simples
- configurações de tracking
- embeds de script
- mapeamento de progresso
- textos e assets

---

# 15. Regras de sessão

## Identidade da sessão

A sessão será baseada em:

- `session_id` persistido em cookie/localStorage

## Comportamento

- se não existir sessão ativa, criar nova
- se existir sessão válida do mesmo quiz em até 24h, retomar
- ao retomar, restaurar:
    - etapa atual
    - variáveis mínimas necessárias
    - progresso visual
- mostrar notificação de continuidade

## Expiração

24 horas após o último progresso relevante.

---

# 16. Pipeline de tracking

## 16.1 Fluxo ideal

1. usuário abre o quiz
2. runtime cria/recupera sessão
3. runtime dispara `quiz_visit`
4. conforme navegação, dispara eventos
5. eventos seguem para edge function
6. edge function normaliza, valida e persiste
7. read model/agregados alimentam o dashboard

## 16.2 Estratégia de envio

### Eventos críticos

Usar `sendBeacon` com fallback para `fetch keepalive`.

### Eventos normais

Podem usar fila leve em memória + flush periódico.

## 16.3 Idempotência

Para evitar duplicação:

- usar chave derivada de `session_id + event_name + step_id + first_occurrence`
- especialmente em métricas principais por etapa

---

# 17. Detecção e exclusão de bots/crawlers

## Estratégia da v1

Classificar tráfego em:

- `human`
- `suspect`
- `bot`

### Sinais possíveis

- user agent conhecido
- ausência de execução real de JS/interação
- padrões de HEAD/GET automáticos
- crawlers de social preview
- assinaturas conhecidas da Meta

### Regra de dashboard

Por padrão, o dashboard exibirá apenas tráfego classificado como humano.

---

# 18. Dashboard interno

## 18.1 Objetivo

Dar ao time de CRO uma leitura clara e rápida da eficiência do quiz.

## 18.2 Telas do MVP

### Tela 1 — Visão geral do quiz

Deve mostrar:

- visitas
- interações
- taxa de interação
- cliques finais
- comparação com período anterior

### Tela 2 — Funil por etapas

Deve mostrar, por etapa:

- nome/identificador
- total absoluto de sessões únicas que chegaram à etapa
- conversão acumulada desde o start
- visualização de queda ao longo do funil

### Tela 3 — Breakdown por origem

Deve mostrar:

- por `utm_source`
- fallback por `origin`
- métricas agregadas por origem

### Tela 4 — Filtros de período

Deve permitir:

- hoje
- ontem
- 7 dias
- período customizado
- comparação automática com período anterior

---

## 18.3 Requisitos de UX do dashboard

- rápido
- leitura limpa
- orientado a decisão
- sem excesso de filtros na v1
- focado no essencial

---

# 19. User stories

## Runtime

1. Como visitante, quero avançar pelas etapas com fluidez para completar o quiz sem atrito.
2. Como visitante, quero voltar uma etapa para corrigir uma resposta.
3. Como visitante, quero ver meu progresso ao longo do quiz.
4. Como visitante, ao retornar dentro de 24h, quero continuar de onde parei.

## CRO

1. Como analista de CRO, quero ver quantas pessoas visitaram e quantas realmente iniciaram o quiz.
2. Como analista de CRO, quero ver a taxa de interação por período.
3. Como analista de CRO, quero ver a queda por etapa com números absolutos e percentuais.
4. Como analista de CRO, quero comparar um período com o anterior.
5. Como analista de CRO, quero segmentar por `utm_source` e, na falta dele, por origem/referrer.

## Operação técnica

1. Como time técnico, quero configurar o quiz via schema para acelerar futuras clonagens.
2. Como time técnico, quero incorporar vídeos por script no local correto da etapa.
3. Como time técnico, quero ignorar bots e crawlers no dashboard.

---

# 20. Critérios de aceitação

## 20.1 Runtime

- o quiz carrega corretamente a etapa inicial
- o avanço entre etapas funciona sem reload total
- o botão voltar funciona
- a barra de progresso acompanha o fluxo real
- a sessão é retomada em até 24h
- a retomada restaura a etapa correta
- o toast/notificação de continuação é exibido
- o componente de vídeo por script renderiza no slot correto

## 20.2 Analytics

- `quiz_visit` dispara no carregamento da etapa inicial
- `quiz_start` dispara apenas na primeira interação válida
- etapas contam uma única vez por sessão nas métricas principais
- clique final é registrado corretamente
- bots/crawlers não entram no dashboard padrão
- comparação com período anterior funciona em timezone `America/Sao_Paulo`

## 20.3 Dashboard

- mostra visitas, interações e taxa de interação
- mostra funil acumulado por etapa
- mostra totais absolutos por etapa
- permite breakdown por `utm_source` e `origin`
- permite filtros de data e comparação automática

---

# 21. Requisitos técnicos detalhados

## 21.1 Frontend

A aplicação deve ser estruturada com:

- engine de renderização de etapas
- registry de componentes
- store de sessão/variáveis
- camada de tracking
- camada de tema/layout

## 21.2 Supabase

Uso previsto:

- Auth para dashboard
- Postgres para eventos/sessões/quizzes
- Edge Functions para ingestão e leitura especializada
- possivelmente views/materialized views para leitura rápida

## 21.3 Publicação

- runtime público do quiz em subdomínio como `quiz.example.com`
- hospedagem em Vercel
- dashboard interno separado por rota protegida ou subpath autenticado

---

# 22. Roadmap recomendado

## Fase 1 — MVP operacional

- engine por schema
- clone do quiz de referência
- tracking próprio
- dashboard essencial
- GTM
- retomada de sessão
- vídeo via script

## Fase 1.5 — Escalabilidade interna

- duplicação de quiz por schema
- versionamento de quiz
- import/export de schema
- editor JSON interno assistido

## Fase 2 — Clonagem assistida

- pipeline com Playwright/crawler
- captura de DOM, assets e fluxos
- tradução assistida por IA para schema interno
- revisão humana e publicação

## Fase 3 — Plataforma interna de funis com IA

- geração de quiz do zero por contexto
- criação de assets/estrutura orientada por prompt
- biblioteca expandida de componentes
- possível painel de edição

---

# 23. Riscos principais

## 23.1 Fidelidade visual

Risco de diferenças entre o clone e o funil original por falta de assets/copy exatos.

### Mitigação

- usar gravação + extração manual dos assets
- QA visual etapa por etapa
- opcionalmente criar checklist de paridade

## 23.2 Perda de tracking

Risco de eventos perdidos em fechamento abrupto ou navegação rápida.

### Mitigação

- `sendBeacon`
- fallback `keepalive`
- deduplicação backend
- eventos mínimos e claros

## 23.3 Poluição por bots

Risco de métricas distorcidas por crawlers e validadores.

### Mitigação

- classificação de tráfego
- exclusão por padrão no dashboard
- lista evolutiva de user agents suspeitos

## 23.4 Complexidade prematura

Risco de tentar construir “plataforma completa” cedo demais.

### Mitigação

- foco absoluto no runtime + dashboard + clone do primeiro quiz
- builder visual fora do escopo

---

# 24. Decisões de produto já fechadas

Estas decisões já ficam oficializadas no PRD:

- v1 será **runtime + dashboard + schema**, sem builder visual
- fluxo do quiz é linear
- sem ramificações
- sessão persistida por `session_id` em cookie/localStorage
- retomada automática por 24h
- etapa conta uma única vez por sessão
- timezone oficial `America/Sao_Paulo`
- bots/crawlers devem ser ignorados nas métricas principais
- dashboard focado no essencial
- dados adicionais como device/country serão armazenados
- stack: React + TypeScript + Supabase + Edge Functions + GTM + Vercel
- domínio em subdomínio interno
- checkout externo único
- IA/clonagem automática entra no roadmap, não no MVP de produção

---

# 25. Recomendação de implementação

Para maximizar velocidade sem sabotar o futuro, a recomendação é:

1. construir primeiro a **engine de schema + registry de componentes**
2. implementar em seguida o **pipeline de analytics**
3. subir o **dashboard essencial**
4. clonar o quiz de referência em cima dessa engine
5. só depois criar utilitários internos de duplicação/importação

Essa ordem reduz retrabalho e garante que o primeiro clone já nasça em cima da base certa.

---

# 26. Definição de sucesso da v1

A v1 será considerada bem-sucedida quando:

- o quiz de referência (treino em casa) estiver clonado com boa fidelidade
- o time interno conseguir operá-lo em produção
- o dashboard mostrar com confiabilidade:
    - visitas
    - interações
    - taxa de interação
    - passagem por etapa
    - clique final
    - comparação com período anterior
    - breakdown por source/origin
- o componente de vídeo via script funcionar corretamente
- a arquitetura estiver pronta para futuras clonagens via schema