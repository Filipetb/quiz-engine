import { z } from 'zod';

/**
 * Validação Zod do schema do quiz. Espelha `types.ts`.
 * Usado em runtime para rejeitar schemas inválidos (PRD §8.1).
 */

const variableTypeSchema = z.enum(['string', 'number', 'boolean', 'string[]']);
const variableValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

const variableDefSchema = z.object({
  type: variableTypeSchema,
  default: variableValueSchema.optional(),
  compute: z.string().optional(),
});

const themeTokensSchema = z
  .object({
    colors: z
      .object({
        bg: z.string().optional(),
        fg: z.string().optional(),
        accent: z.string().optional(),
        accentFg: z.string().optional(),
        muted: z.string().optional(),
      })
      .partial()
      .optional(),
    fonts: z
      .object({
        sans: z.string().optional(),
      })
      .partial()
      .optional(),
    radius: z.string().optional(),
  })
  .partial();

const quizMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.number().int().positive(),
  slug: z.string().optional(),
});

const quizHeadSchema = z.object({
  preload: z
    .array(
      z.object({
        href: z.string().min(1),
        as: z.enum(['script', 'fetch', 'style', 'font', 'image']),
        crossorigin: z.enum(['', 'anonymous', 'use-credentials']).optional(),
      }),
    )
    .optional(),
  dnsPrefetch: z.array(z.string().min(1)).optional(),
  inlineScript: z.string().min(1).optional(),
});

const baseComponentFields = {
  id: z.string().optional(),
  className: z.string().optional(),
  hiddenUntilPitch: z.boolean().optional(),
};

const headingComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('heading'),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

const textComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('text'),
  text: z.string(),
});

const imageComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('image'),
  src: z.string(),
  alt: z.string().optional(),
  aspectRatio: z.string().optional(),
});

const buttonComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('button'),
  label: z.string(),
  action: z.enum(['next', 'back']).optional(),
  href: z.string().url().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  variant: z.enum(['primary', 'secondary', 'ghost', 'hero', 'raised']).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/, 'color deve ser hex (#RGB ou #RRGGBB)')
    .optional(),
});

const choiceOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  imageSrc: z.string().optional(),
});

const choiceImageLayoutSchema = z.enum(['grid', 'prepend']);

const singleChoiceComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('single_choice'),
  variable: z.string().min(1),
  options: z.array(choiceOptionSchema).min(1),
  autoAdvance: z.boolean().optional(),
  imageLayout: choiceImageLayoutSchema.optional(),
});

const multiChoiceComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('multi_choice'),
  variable: z.string().min(1),
  options: z.array(choiceOptionSchema).min(1),
  minSelected: z.number().int().nonnegative().optional(),
  maxSelected: z.number().int().positive().optional(),
  continueLabel: z.string().optional(),
  imageLayout: choiceImageLayoutSchema.optional(),
});

const textInputComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('text_input'),
  variable: z.string().min(1),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  continueLabel: z.string().optional(),
});

const numberInputComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('number_input'),
  variable: z.string().min(1),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  required: z.boolean().optional(),
  continueLabel: z.string().optional(),
});

const numericPickerFields = {
  variable: z.string().min(1),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
  default: z.number().optional(),
  unit: z.string().optional(),
  label: z.string().optional(),
  continueLabel: z.string().optional(),
};

const heightPickerComponentSchema = z.object({
  ...baseComponentFields,
  ...numericPickerFields,
  type: z.literal('height_picker'),
});
const weightPickerComponentSchema = z.object({
  ...baseComponentFields,
  ...numericPickerFields,
  type: z.literal('weight_picker'),
});
const agePickerComponentSchema = z.object({
  ...baseComponentFields,
  ...numericPickerFields,
  type: z.literal('age_picker'),
});

const bmiGaugeComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('bmi_gauge'),
  variable: z.string().min(1),
  caption: z.string().optional(),
});

const progressChartComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('progress_chart'),
  weightVariable: z.string().min(1),
  targetVariable: z.string().min(1).optional(),
  weeks: z.number().int().positive().optional(),
  weeklyDeltaKg: z.number().optional(),
  title: z.string().optional(),
});

const carouselImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const imageCarouselComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('image_carousel'),
  images: z.array(carouselImageSchema).min(1),
  autoPlay: z.boolean().optional(),
  intervalMs: z.number().positive().optional(),
  aspectRatio: z.string().optional(),
});

const loadingScreenComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('loading_screen'),
  text: z.string().optional(),
  subtext: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  variant: z.enum(['spinner', 'bar']).optional(),
});

const testimonialItemSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  headline: z.string(),
  handle: z.string().optional(),
  body: z.string(),
});

const testimonialCarouselComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('testimonial_carousel'),
  items: z.array(testimonialItemSchema).min(1),
  autoPlay: z.boolean().optional(),
  intervalMs: z.number().positive().optional(),
});

const calloutComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('callout'),
  title: z.string().optional(),
  body: z.string().optional(),
  variant: z.enum(['success', 'info', 'warning', 'danger', 'accent']).optional(),
  alignment: z.enum(['left', 'center']).optional(),
});

const progressBarComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('progress_bar'),
  percent: z.number().min(0).max(100),
  color: z.enum(['accent', 'success']).optional(),
  label: z.string().optional(),
  showValue: z.boolean().optional(),
});

const statBarItemSchema = z.object({
  badge: z.string(),
  badgeVariant: z.enum(['muted', 'accent']).optional(),
  percent: z.number().min(0).max(100),
  color: z.enum(['accent', 'success']).optional(),
  caption: z.string().optional(),
});

const statBarsComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('stat_bars'),
  items: z.array(statBarItemSchema).min(1).max(4),
  barHeight: z.string().optional(),
});

const faqItemSchema = z.object({
  icon: z.string().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

const faqComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('faq'),
  items: z.array(faqItemSchema).min(1),
});

const pricingCardComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('pricing_card'),
  badge: z.string().min(1),
  badgeColor: z.string().optional(),
  planName: z.string().min(1),
  originalPrice: z.string().min(1),
  price: z.string().min(1),
  dailyLabel: z.string().optional(),
  dailyPrice: z.string().optional(),
  dailySuffix: z.string().optional(),
});

const pitchSyncSchema = z
  .object({
    selector: z.string().min(1).optional(),
    delaySeconds: z.number().nonnegative().optional(),
    variants: z
      .array(
        z.object({
          videoId: z.string().min(1),
          delaySeconds: z.number().nonnegative(),
        }),
      )
      .optional(),
  })
  .refine(
    (v) => v.delaySeconds !== undefined || (v.variants && v.variants.length > 0),
    { message: 'pitchSync precisa de delaySeconds ou variants.' },
  );

const videoScriptEmbedComponentSchema = z.object({
  ...baseComponentFields,
  type: z.literal('video_script'),
  scriptSrc: z.string().min(1).optional(),
  inlineScript: z.string().min(1).optional(),
  containerId: z.string().min(1).optional(),
  scriptAttributes: z.record(z.string(), z.string()).optional(),
  playerTag: z.string().min(1).optional(),
  playerAttributes: z.record(z.string(), z.string()).optional(),
  aspectRatio: z.string().optional(),
  pitchSync: pitchSyncSchema.optional(),
});

const componentSchema = z.discriminatedUnion('type', [
  headingComponentSchema,
  textComponentSchema,
  imageComponentSchema,
  buttonComponentSchema,
  singleChoiceComponentSchema,
  multiChoiceComponentSchema,
  textInputComponentSchema,
  numberInputComponentSchema,
  heightPickerComponentSchema,
  weightPickerComponentSchema,
  agePickerComponentSchema,
  bmiGaugeComponentSchema,
  progressChartComponentSchema,
  imageCarouselComponentSchema,
  loadingScreenComponentSchema,
  statBarsComponentSchema,
  progressBarComponentSchema,
  calloutComponentSchema,
  testimonialCarouselComponentSchema,
  faqComponentSchema,
  pricingCardComponentSchema,
  videoScriptEmbedComponentSchema,
]);

const actionMapSchema = z
  .object({
    next: z.string().optional(),
    back: z.string().optional(),
  })
  .partial();

const stepSchemaValidator = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  analyticsKey: z.string().min(1),
  progress: z.number().min(0).max(1).optional(),
  components: z.array(componentSchema),
  actions: actionMapSchema.optional(),
});

export const quizSchemaValidator = z
  .object({
    quiz: quizMetadataSchema,
    theme: themeTokensSchema.optional(),
    head: quizHeadSchema.optional(),
    variables: z.record(z.string(), variableDefSchema).optional(),
    steps: z.array(stepSchemaValidator).min(1),
  })
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    for (const step of data.steps) {
      if (ids.has(step.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step id duplicado: ${step.id}`,
          path: ['steps'],
        });
      }
      ids.add(step.id);
    }
    for (const step of data.steps) {
      const nextId = step.actions?.next;
      if (nextId && !ids.has(nextId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step "${step.id}" referencia next "${nextId}" inexistente.`,
          path: ['steps'],
        });
      }
      for (const component of step.components) {
        if (
          component.type === 'video_script' &&
          !component.scriptSrc &&
          !component.inlineScript
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Step "${step.id}": video_script precisa de scriptSrc ou inlineScript.`,
            path: ['steps'],
          });
        }
        if (component.type === 'button') {
          if (!component.action && !component.href) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Step "${step.id}": button precisa de action ou href.`,
              path: ['steps'],
            });
          }
          if (component.action && component.href) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Step "${step.id}": button não pode ter action e href ao mesmo tempo.`,
              path: ['steps'],
            });
          }
        }
      }
    }
  });

export type ValidatedQuizSchema = z.infer<typeof quizSchemaValidator>;
