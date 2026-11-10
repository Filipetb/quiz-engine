import { useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import type { RuntimeContext, VariableValue } from '@/quiz/engine/types';

/**
 * Base de height/weight/age picker: stepper visual com −/+ e valor grande.
 * Schema-level differences (faixa de min/max, unidade, ícone) vêm via props.
 */

export interface NumericPickerProps {
  context: RuntimeContext;
  variable: string;
  min: number;
  max: number;
  step?: number;
  default?: number;
  unit?: string;
  label?: string;
  continueLabel?: string;
  className?: string;
  accent?: 'accent' | 'muted';
}

function toNumber(value: VariableValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function NumericPicker({
  context,
  variable,
  min,
  max,
  step = 1,
  default: defaultValue,
  unit,
  label,
  continueLabel,
  className,
}: NumericPickerProps): JSX.Element {
  const stored = toNumber(context.variables[variable]);
  const initial =
    stored ??
    defaultValue ??
    Math.round(((min + max) / 2) / step) * step;

  const [value, setValue] = useState<number>(initial);

  useEffect(() => {
    if (stored === null) {
      context.setVariable(variable, initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit(next: number): void {
    const clamped = clamp(next, min, max);
    setValue(clamped);
    context.setVariable(variable, clamped);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      commit(value + step);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      commit(value - step);
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {label && (
        <span className="text-sm font-medium text-quiz-fg/80">{label}</span>
      )}
      <div
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          'flex items-center justify-between gap-4 rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2',
        )}
      >
        <button
          type="button"
          onClick={() => commit(value - step)}
          disabled={value <= min}
          aria-label="Diminuir"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-quiz-muted text-xl font-bold text-quiz-fg transition-colors hover:bg-quiz-muted/80 disabled:pointer-events-none disabled:opacity-40"
        >
          −
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-2 tabular-nums">
          <span className="text-5xl font-bold text-quiz-fg">{value}</span>
          {unit && (
            <span className="text-lg font-medium text-quiz-fg/60">{unit}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => commit(value + step)}
          disabled={value >= max}
          aria-label="Aumentar"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-quiz-muted text-xl font-bold text-quiz-fg transition-colors hover:bg-quiz-muted/80 disabled:pointer-events-none disabled:opacity-40"
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => commit(Number(event.target.value))}
        aria-label={label ?? variable}
        className="h-2 w-full appearance-none rounded-full bg-quiz-muted accent-quiz-accent"
      />
      <button
        type="button"
        onClick={() => context.advance()}
        className="quiz-btn-primary"
      >
        {continueLabel ?? 'Continuar'}
      </button>
    </div>
  );
}
