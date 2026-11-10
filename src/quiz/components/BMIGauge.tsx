import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  BMIGaugeComponent as BMIGaugeSchema,
  ComponentProps,
} from '@/quiz/engine/types';

/**
 * Gauge horizontal com faixas da OMS. Posição do ponteiro animada via rAF.
 */

type Range = {
  label: string;
  max: number;
  color: string;
};

const RANGES: Range[] = [
  { label: 'Abaixo', max: 18.5, color: 'bg-sky-400' },
  { label: 'Ideal', max: 25, color: 'bg-emerald-500' },
  { label: 'Sobrepeso', max: 30, color: 'bg-amber-400' },
  { label: 'Obesidade', max: 40, color: 'bg-rose-500' },
];

const AXIS_MIN = 15;
const AXIS_MAX = 40;

function positionPct(bmi: number): number {
  const clamped = Math.max(AXIS_MIN, Math.min(AXIS_MAX, bmi));
  return ((clamped - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;
}

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso ideal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidade';
}

export function BMIGauge({
  config,
  context,
}: ComponentProps<BMIGaugeSchema>): JSX.Element {
  const rawValue = context.variables[config.variable];
  const bmi =
    typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;

  const [displayed, setDisplayed] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (bmi === null) {
      setDisplayed(null);
      return;
    }
    const start = performance.now();
    const from = displayed ?? AXIS_MIN;
    const to = bmi;
    const duration = 600;

    function tick(now: number): void {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmi]);

  if (bmi === null) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-6 text-center text-base text-quiz-fg/60',
          config.className,
        )}
      >
        Preencha peso e altura para ver seu IMC.
      </div>
    );
  }

  const shown = displayed ?? bmi;
  const pct = positionPct(shown);

  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-6',
        config.className,
      )}
      aria-label={`IMC ${shown.toFixed(1)}`}
    >
      <div className="flex items-baseline justify-center gap-2 tabular-nums">
        <span className="text-5xl font-bold text-quiz-fg">
          {shown.toFixed(1)}
        </span>
        <span className="text-sm font-medium text-quiz-fg/60">kg/m²</span>
      </div>
      <p className="mt-1 text-center text-base font-medium text-quiz-fg/80">
        {classifyBmi(bmi)}
      </p>
      <div className="relative mt-6 h-3 w-full overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          {RANGES.map((range, idx) => {
            const prev = idx === 0 ? AXIS_MIN : RANGES[idx - 1].max;
            const width = ((range.max - prev) / (AXIS_MAX - AXIS_MIN)) * 100;
            return (
              <div
                key={range.label}
                className={range.color}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>
      </div>
      <div
        className="relative h-4"
        style={{ marginTop: '-0.25rem' }}
        aria-hidden
      >
        <div
          className="absolute top-0 h-0 w-0 transition-all duration-500 ease-out"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '10px solid hsl(var(--quiz-fg))',
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-quiz-fg/50">
        {RANGES.map((range) => (
          <span key={range.label}>{range.label}</span>
        ))}
      </div>
      {config.caption && (
        <p className="mt-4 text-center text-xs text-quiz-fg/60">
          {config.caption}
        </p>
      )}
    </div>
  );
}
