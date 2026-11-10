import type {
  ComponentProps,
  HeightPickerComponent as HeightPickerSchema,
} from '@/quiz/engine/types';

import { NumericPicker } from './NumericPicker';

export function HeightPicker({
  config,
  context,
}: ComponentProps<HeightPickerSchema>): JSX.Element {
  return (
    <NumericPicker
      context={context}
      variable={config.variable}
      min={config.min}
      max={config.max}
      step={config.step}
      default={config.default}
      unit={config.unit ?? 'cm'}
      label={config.label}
      continueLabel={config.continueLabel}
      className={config.className}
    />
  );
}
