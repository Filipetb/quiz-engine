import { useId, useState, type FormEvent } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  NumberInputComponent as NumberInputSchema,
} from '@/quiz/engine/types';

function currentAsString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function NumberInput({
  config,
  context,
}: ComponentProps<NumberInputSchema>): JSX.Element {
  const inputId = useId();
  const rawValue = context.variables[config.variable];
  const [draft, setDraft] = useState<string>(currentAsString(rawValue));
  const [touched, setTouched] = useState(false);

  const isRequired = config.required ?? true;
  const parsed = draft.trim() === '' ? null : Number(draft);
  const isInvalidNumber = parsed !== null && !Number.isFinite(parsed);
  const belowMin =
    parsed !== null && typeof config.min === 'number' && parsed < config.min;
  const aboveMax =
    parsed !== null && typeof config.max === 'number' && parsed > config.max;
  const isEmpty = draft.trim() === '';
  const blocksContinue =
    (isRequired && isEmpty) || isInvalidNumber || belowMin || aboveMax;
  const showError = touched && blocksContinue && !isEmpty;
  const showRequired = touched && isRequired && isEmpty;

  function onChange(next: string): void {
    setDraft(next);
    if (next.trim() === '') {
      context.setVariable(config.variable, null);
      return;
    }
    const n = Number(next);
    if (Number.isFinite(n)) context.setVariable(config.variable, n);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (blocksContinue) return;
    context.advance();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-3', config.className)}
    >
      {config.label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-quiz-fg"
        >
          {config.label}
          {isRequired && <span className="ml-1 text-quiz-accent">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        value={draft}
        min={config.min}
        max={config.max}
        placeholder={config.placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        className={cn(
          'h-12 w-full rounded-[var(--radius)] border bg-quiz-bg px-4 text-base text-quiz-fg',
          'placeholder:text-quiz-fg/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2',
          showError || showRequired
            ? 'border-destructive'
            : 'border-quiz-muted',
        )}
      />
      {showRequired && (
        <p className="text-xs text-destructive">Este campo é obrigatório.</p>
      )}
      {showError && belowMin && (
        <p className="text-xs text-destructive">
          Valor mínimo: {config.min}
        </p>
      )}
      {showError && aboveMax && (
        <p className="text-xs text-destructive">
          Valor máximo: {config.max}
        </p>
      )}
      <button
        type="submit"
        className="quiz-btn-primary"
        disabled={blocksContinue}
      >
        {config.continueLabel ?? 'Continuar'}
      </button>
    </form>
  );
}
