import { AgePicker } from '@/quiz/components/AgePicker';
import { BMIGauge } from '@/quiz/components/BMIGauge';
import { Button } from '@/quiz/components/Button';
import { Callout } from '@/quiz/components/Callout';
import { FAQ } from '@/quiz/components/FAQ';
import { Heading } from '@/quiz/components/Heading';
import { HeightPicker } from '@/quiz/components/HeightPicker';
import { Image } from '@/quiz/components/Image';
import { ImageCarousel } from '@/quiz/components/ImageCarousel';
import { LoadingScreen } from '@/quiz/components/LoadingScreen';
import { MultiChoice } from '@/quiz/components/MultiChoice';
import { NumberInput } from '@/quiz/components/NumberInput';
import { PricingCard } from '@/quiz/components/PricingCard';
import { ProgressBar } from '@/quiz/components/ProgressBar';
import { ProgressChart } from '@/quiz/components/ProgressChart';
import { SingleChoice } from '@/quiz/components/SingleChoice';
import { StatBars } from '@/quiz/components/StatBars';
import { TestimonialCarousel } from '@/quiz/components/TestimonialCarousel';
import { Text } from '@/quiz/components/Text';
import { TextInput } from '@/quiz/components/TextInput';
import { VideoScriptEmbed } from '@/quiz/components/VideoScriptEmbed';
import { WeightPicker } from '@/quiz/components/WeightPicker';

import type { ComponentProps, ComponentSchema, ComponentType } from './types';

/**
 * Registry de componentes do runtime.
 *
 * O runtime do quiz tem concerns globais (p.ex. `ResumeToast` da PRD §8.5)
 * que NÃO ficam no registry — são montados pelo `StepRenderer` fora do fluxo
 * de componentes do step. Isso evita exigir que cada schema repita um
 * "resume_toast" no primeiro step pra suportar retomada.
 */

type RegistryEntry = (props: ComponentProps) => JSX.Element;

const registry: Record<ComponentType, RegistryEntry> = {
  heading: Heading as RegistryEntry,
  text: Text as RegistryEntry,
  image: Image as RegistryEntry,
  button: Button as RegistryEntry,
  callout: Callout as RegistryEntry,
  single_choice: SingleChoice as RegistryEntry,
  multi_choice: MultiChoice as RegistryEntry,
  text_input: TextInput as RegistryEntry,
  number_input: NumberInput as RegistryEntry,
  height_picker: HeightPicker as RegistryEntry,
  weight_picker: WeightPicker as RegistryEntry,
  age_picker: AgePicker as RegistryEntry,
  bmi_gauge: BMIGauge as RegistryEntry,
  progress_bar: ProgressBar as RegistryEntry,
  progress_chart: ProgressChart as RegistryEntry,
  image_carousel: ImageCarousel as RegistryEntry,
  loading_screen: LoadingScreen as RegistryEntry,
  stat_bars: StatBars as RegistryEntry,
  testimonial_carousel: TestimonialCarousel as RegistryEntry,
  faq: FAQ as RegistryEntry,
  pricing_card: PricingCard as RegistryEntry,
  video_script: VideoScriptEmbed as RegistryEntry,
};

export function registerComponent(
  type: ComponentType,
  component: RegistryEntry,
): void {
  registry[type] = component;
}

export function getComponent(type: ComponentType): RegistryEntry | null {
  return registry[type] ?? null;
}

export function renderComponent(
  config: ComponentSchema,
  context: ComponentProps['context'],
): JSX.Element {
  const Component = getComponent(config.type);
  if (!Component) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
        Componente desconhecido:{' '}
        <code className="font-mono">{config.type}</code>
      </div>
    );
  }
  const rendered = <Component config={config} context={context} />;
  if (config.hiddenUntilPitch) {
    return <div className="pq-pitch-hidden">{rendered}</div>;
  }
  return rendered;
}
