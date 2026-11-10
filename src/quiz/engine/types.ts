/**
 * Tipos do schema do quiz.
 *
 * O schema é a fonte da verdade do runtime (PRD §14). Nenhuma lógica de
 * navegação, variáveis ou componentes pode ser hardcoded fora daqui.
 *
 * Cada `ComponentSchema` é discriminado por `type`. Componentes novos
 * aparecem aqui *e* no registry (`registry.ts`). A validação de runtime
 * acontece em `schema.ts` (zod).
 */

export type VariableType = 'string' | 'number' | 'boolean' | 'string[]';

export type VariableValue = string | number | boolean | string[] | null;

export interface VariableDef {
  type: VariableType;
  default?: VariableValue;
  /**
   * Expressão aritmética simples avaliada em runtime pelo motor de `compute.ts`.
   * Apenas operadores + - * / ( ) e referências a outras variáveis são suportados.
   * Nunca é passada para `eval` ou `new Function`.
   */
  compute?: string;
}

export interface ThemeTokens {
  colors?: {
    bg?: string;
    fg?: string;
    accent?: string;
    accentFg?: string;
    muted?: string;
  };
  fonts?: {
    sans?: string;
  };
  radius?: string;
}

export interface QuizMetadata {
  id: string;
  name: string;
  version: number;
  slug?: string;
}

/**
 * Tags injetadas em `document.head` quando o quiz carrega — escopo por quiz,
 * então preloads/dns-prefetch de um quiz não afetam os demais. Usado para
 * acelerar o carregamento de players de VSL (preload do player.js/HLS).
 */
export interface QuizHeadPreload {
  href: string;
  as: 'script' | 'fetch' | 'style' | 'font' | 'image';
  crossorigin?: '' | 'anonymous' | 'use-credentials';
}

export interface QuizHead {
  preload?: QuizHeadPreload[];
  dnsPrefetch?: string[];
  /** Script inline (ex.: sentinela de timing do player). Injetado uma vez. */
  inlineScript?: string;
}

/* ─────────────────────── Componentes ─────────────────────── */

/** Campos comuns a todos os componentes. */
interface BaseComponent {
  id?: string;
  /** Tailwind classes adicionais aplicadas no container do componente. */
  className?: string;
  /**
   * Se `true`, o componente é renderizado com `display:none` até que o
   * `video_script` do step chegue ao momento do pitch e chame
   * `displayHiddenElements` (Vturb). Ver `VideoScriptEmbedComponent.pitchSync`.
   */
  hiddenUntilPitch?: boolean;
}

export interface HeadingComponent extends BaseComponent {
  type: 'heading';
  text: string;
  level?: 1 | 2 | 3;
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  text: string;
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt?: string;
  aspectRatio?: string;
}

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  label: string;
  /** Navegação interna. Obrigatório se `href` não for informado. */
  action?: 'next' | 'back';
  /** URL externa. Quando presente, renderiza `<a>` em vez de `<button>`. */
  href?: string;
  /** Target do `<a>` — default `_self` (fluxo de checkout). */
  target?: '_self' | '_blank';
  variant?: 'primary' | 'secondary' | 'ghost' | 'hero' | 'raised';
  /**
   * Hex custom (ex. `#16A34A`) sobrescrevendo a cor de acento **só deste botão**.
   * Aplicado via CSS var `--btn-bg` → pulse do hero e bg da variante raised
   * respeitam a mesma cor.
   */
  color?: string;
}

export interface ChoiceOption {
  value: string;
  label: string;
  imageSrc?: string;
}

/**
 * Layout das imagens nas opções:
 * - `"grid"`: 2 colunas, imagem grande em cima com barra rosa embaixo (default).
 * - `"prepend"`: linha única, thumbnail quadrado à esquerda, label no meio.
 */
export type ChoiceImageLayout = 'grid' | 'prepend';

export interface SingleChoiceComponent extends BaseComponent {
  type: 'single_choice';
  variable: string;
  options: ChoiceOption[];
  /** Se true (default), selecionar avança automaticamente para o próximo step. */
  autoAdvance?: boolean;
  imageLayout?: ChoiceImageLayout;
}

export interface MultiChoiceComponent extends BaseComponent {
  type: 'multi_choice';
  variable: string;
  options: ChoiceOption[];
  minSelected?: number;
  maxSelected?: number;
  continueLabel?: string;
  imageLayout?: ChoiceImageLayout;
}

export interface TextInputComponent extends BaseComponent {
  type: 'text_input';
  variable: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  continueLabel?: string;
}

export interface NumberInputComponent extends BaseComponent {
  type: 'number_input';
  variable: string;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  continueLabel?: string;
}

/* ── Pickers numéricos (stepper visual) ── */

interface NumericPickerBase extends BaseComponent {
  variable: string;
  min: number;
  max: number;
  step?: number;
  default?: number;
  unit?: string;
  label?: string;
  continueLabel?: string;
}

export interface HeightPickerComponent extends NumericPickerBase {
  type: 'height_picker';
}
export interface WeightPickerComponent extends NumericPickerBase {
  type: 'weight_picker';
}
export interface AgePickerComponent extends NumericPickerBase {
  type: 'age_picker';
}

/* ── Gauge de IMC ── */

export interface BMIGaugeComponent extends BaseComponent {
  type: 'bmi_gauge';
  variable: string;
  caption?: string;
}

/* ── Gráfico de progresso ── */

export interface ProgressChartComponent extends BaseComponent {
  type: 'progress_chart';
  /** Variável com o peso atual (ponto de partida, em kg). */
  weightVariable: string;
  /** Variável com o peso alvo. Se ausente, usamos `weeklyDeltaKg`. */
  targetVariable?: string;
  weeks?: number;
  weeklyDeltaKg?: number;
  title?: string;
}

/* ── Carrossel ── */

export interface CarouselImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ImageCarouselComponent extends BaseComponent {
  type: 'image_carousel';
  images: CarouselImage[];
  autoPlay?: boolean;
  intervalMs?: number;
  aspectRatio?: string;
}

/* ── Tela de carregamento (avança sozinha) ── */

export interface LoadingScreenComponent extends BaseComponent {
  type: 'loading_screen';
  text?: string;
  subtext?: string;
  durationMs?: number;
  /**
   * - `"spinner"` (default): ícone giratório + barra horizontal fina.
   * - `"bar"`: barra de progresso em destaque, texto acima e subtexto abaixo.
   */
  variant?: 'spinner' | 'bar';
}

/* ── Carrossel de depoimentos em texto ── */

export interface TestimonialItem {
  /** 0..5. Default 5. */
  rating?: number;
  /** Título/resultado em destaque. Suporta `**highlight**`. */
  headline: string;
  /** Ex.: "@lara_gonzl". Exibido abaixo do título. */
  handle?: string;
  /** Depoimento em texto corrido. */
  body: string;
}

export interface TestimonialCarouselComponent extends BaseComponent {
  type: 'testimonial_carousel';
  items: TestimonialItem[];
  autoPlay?: boolean;
  intervalMs?: number;
}

/* ── Callout (card colorido com título + corpo) ── */

export type CalloutVariant = 'success' | 'info' | 'warning' | 'danger' | 'accent';

export interface CalloutComponent extends BaseComponent {
  type: 'callout';
  /** Suporta `**destaque**` markdown-like. */
  title?: string;
  /** Suporta `**destaque**` markdown-like. */
  body?: string;
  variant?: CalloutVariant;
  alignment?: 'left' | 'center';
}

/* ── Barra de progresso horizontal animada ── */

export interface ProgressBarComponent extends BaseComponent {
  type: 'progress_bar';
  /** Valor final da animação, 0..100. */
  percent: number;
  color?: 'accent' | 'success';
  /** Label à esquerda (ex.: "Tasa de éxito"). */
  label?: string;
  /** Mostra o `percent` à direita (ex.: "96%"). Default true. */
  showValue?: boolean;
}

/* ── Barras verticais estatísticas (2 colunas) ── */

export interface StatBarItem {
  /** Texto do badge acima da barra. Suporta interpolação `{variavel}`. */
  badge: string;
  badgeVariant?: 'muted' | 'accent';
  /** Altura da barra em 0..100. */
  percent: number;
  color?: 'accent' | 'success';
  /** Texto abaixo da barra. Suporta `{variavel}` e `**destaque**`. */
  caption?: string;
}

export interface StatBarsComponent extends BaseComponent {
  type: 'stat_bars';
  items: StatBarItem[];
  /** Altura em CSS da área da barra (default `10rem`). */
  barHeight?: string;
}

/* ── FAQ (perguntas frequentes com emoji + divider) ── */

export interface FAQItem {
  icon?: string;
  question: string;
  answer: string;
}

export interface FAQComponent extends BaseComponent {
  type: 'faq';
  items: FAQItem[];
}

/* ── Pricing card ── */

export interface PricingCardComponent extends BaseComponent {
  type: 'pricing_card';
  /** Texto do badge topo (ex. "ACCESO PERMANENTE – PAGO ÚNICO"). */
  badge: string;
  /** Cor de fundo do badge em hex. Default: cor do tema accent. */
  badgeColor?: string;
  planName: string;
  originalPrice: string;
  price: string;
  dailyLabel?: string;
  dailyPrice?: string;
  dailySuffix?: string;
}

/* ── Vídeo via script (PRD §8.6) ── */

export interface VideoScriptEmbedComponent extends BaseComponent {
  type: 'video_script';
  /**
   * URL de script externo. Injetado em `document.head` com dedup por URL —
   * sobrevive a back/forward para não registrar custom elements duplicados.
   */
  scriptSrc?: string;
  /** Script inline executado no slot local (limpo no unmount). */
  inlineScript?: string;
  /** Id de `<div>` renderizado no slot quando o player espera achar por id. */
  containerId?: string;
  /** Atributos aplicados em ambos os scripts injetados. */
  scriptAttributes?: Record<string, string>;
  /**
   * Tag customizada renderizada no slot como alvo do player
   * (ex.: `"vturb-smartplayer"`, `"wistia-player"`). Criada a cada mount.
   */
  playerTag?: string;
  /** Atributos do `playerTag` (ex.: `{ id: "ab-...", style: "..." }`). */
  playerAttributes?: Record<string, string>;
  aspectRatio?: string;
  /**
   * Sincronização de elementos `hiddenUntilPitch` com o timestamp do pitch.
   * Registra listener em `document` para `player:ready` e chama
   * `player.displayHiddenElements(delay, [selector], { persist: true })`.
   * Se `variants` existir (teste A/B), o delay é resolvido por `event.detail.config.id`;
   * `delaySeconds` é fallback.
   */
  pitchSync?: {
    /** Seletor CSS revelado pela Vturb. Default: `.pq-pitch-hidden`. */
    selector?: string;
    /** Tempo do pitch em segundos (vídeo único ou fallback do A/B). */
    delaySeconds?: number;
    /** Mapeamento id → delay para teste A/B. */
    variants?: Array<{ videoId: string; delaySeconds: number }>;
  };
}

export type ComponentSchema =
  | HeadingComponent
  | TextComponent
  | ImageComponent
  | ButtonComponent
  | SingleChoiceComponent
  | MultiChoiceComponent
  | TextInputComponent
  | NumberInputComponent
  | HeightPickerComponent
  | WeightPickerComponent
  | AgePickerComponent
  | BMIGaugeComponent
  | ProgressChartComponent
  | ImageCarouselComponent
  | LoadingScreenComponent
  | StatBarsComponent
  | ProgressBarComponent
  | CalloutComponent
  | TestimonialCarouselComponent
  | FAQComponent
  | PricingCardComponent
  | VideoScriptEmbedComponent;

export type ComponentType = ComponentSchema['type'];

/* ─────────────────────── Steps + Actions ─────────────────────── */

export interface ActionMap {
  next?: string;
  back?: string;
}

export interface StepSchema {
  id: string;
  order: number;
  /** Chave estável para analytics (PRD §13.1 quiz_step.analytics_key). */
  analyticsKey: string;
  /** Progresso 0..1 desta etapa. Se ausente, o runtime infere a partir de `order`. */
  progress?: number;
  components: ComponentSchema[];
  actions?: ActionMap;
}

/* ─────────────────────── Quiz completo ─────────────────────── */

export interface QuizSchema {
  quiz: QuizMetadata;
  theme?: ThemeTokens;
  head?: QuizHead;
  variables?: Record<string, VariableDef>;
  steps: StepSchema[];
}

/* ─────────────────────── Contexto de runtime ─────────────────────── */

/**
 * Contrato passado a cada componente do registry.
 * Todo componente recebe `{ config, context }`.
 */
export interface RuntimeContext {
  variables: Record<string, VariableValue>;
  setVariable: (key: string, value: VariableValue) => void;
  advance: (explicitNext?: string) => void;
  back: () => void;
  trackCtaClick: () => void;
  currentStep: StepSchema;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface ComponentProps<T extends ComponentSchema = ComponentSchema> {
  config: T;
  context: RuntimeContext;
}
