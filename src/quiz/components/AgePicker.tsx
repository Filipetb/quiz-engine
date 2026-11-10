import type {
  AgePickerComponent as AgePickerSchema,
  ComponentProps,
} from '@/quiz/engine/types';

import { NumericPicker } from './NumericPicker';

export function AgePicker({
  config,
  context,
}: ComponentProps<AgePickerSchema>): JSX.Element {
  return (
    <NumericPicker
      context={context}
      variable={config.variable}
      min={config.min}
      max={config.max}
      step={config.step}
      default={config.default}
      unit={config.unit ?? 'anos'}
      label={config.label}
      continueLabel={config.continueLabel}
      className={config.className}
    />
  );
}
