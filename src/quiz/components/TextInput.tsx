import { useId, useState, type FormEvent } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  TextInputComponent as TextInputSchema,
} from '@/quiz/engine/types';

export function TextInput({
  config,
  context,
}: ComponentProps<TextInputSchema>): JSX.Element {
  const inputId = useId();
  const rawValue = context.variables[config.variable];
  const stringValue = typeof rawValue === 'string' ? rawValue : '';
  const [touched, setTouched] = useState(false);
  const isRequired = config.required ?? false;
  const isEmpty = stringValue.trim().length === 0;
  const showError = touched && isRequired && isEmpty;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (isRequired && isEmpty) return;
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
        type="text"
        value={stringValue}
        placeholder={config.placeholder}
        onChange={(event) =>
          context.setVariable(config.variable, event.target.value)
        }
        onBlur={() => setTouched(true)}
        className={cn(
          'h-12 w-full rounded-[var(--radius)] border bg-quiz-bg px-4 text-base text-quiz-fg',
          'placeholder:text-quiz-fg/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2',
          showError ? 'border-destructive' : 'border-quiz-muted',
        )}
      />
      {showError && (
        <p className="text-xs text-destructive">Este campo é obrigatório.</p>
      )}
      <button
        type="submit"
        className="quiz-btn-primary"
        disabled={isRequired && isEmpty}
      >
        {config.continueLabel ?? 'Continuar'}
      </button>
    </form>
  );
}
