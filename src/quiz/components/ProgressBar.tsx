import { useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  ProgressBarComponent as ProgressBarSchema,
} from '@/quiz/engine/types';

const FILL_COLOR: Record<NonNullable<ProgressBarSchema['color']>, string> = {
  accent: 'bg-quiz-accent',
  success: 'bg-emerald-500',
};

export function ProgressBar({
  config,
}: ComponentProps<ProgressBarSchema>): JSX.Element {
  const target = Math.max(0, Math.min(100, config.percent));
  const [animated, setAnimated] = useState(false);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const enter = window.setTimeout(() => setAnimated(true), 60);
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    function tick(now: number): void {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(enter);
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const showValue = config.showValue !== false;
  const fill = FILL_COLOR[config.color ?? 'accent'];

  return (
    <div className={cn('flex flex-col gap-2', config.className)}>
      {(config.label || showValue) && (
        <div className="flex items-center justify-between text-sm font-semibold text-quiz-fg">
          {config.label ? <span>{config.label}</span> : <span />}
          {showValue && (
            <span className="tabular-nums text-quiz-fg">{displayed}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayed}
        className="h-3 w-full overflow-hidden rounded-full bg-quiz-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-[1200ms] ease-out',
            fill,
          )}
          style={{ width: `${animated ? target : 0}%` }}
        />
      </div>
    </div>
  );
}
