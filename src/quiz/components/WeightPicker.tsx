import type {
  ComponentProps,
  WeightPickerComponent as WeightPickerSchema,
} from '@/quiz/engine/types';

import { NumericPicker } from './NumericPicker';

export function WeightPicker({
  config,
  context,
}: ComponentProps<WeightPickerSchema>): JSX.Element {
  return (
    <NumericPicker
      context={context}
      variable={config.variable}
      min={config.min}
      max={config.max}
      step={config.step}
      default={config.default}
      unit={config.unit ?? 'kg'}
      label={config.label}
      continueLabel={config.continueLabel}
      className={config.className}
    />
  );
}
