import { useEffect } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  LoadingScreenComponent as LoadingScreenSchema,
} from '@/quiz/engine/types';

/**
 * Tela de "analisando…" — avança sozinha após `durationMs`. A barra de
 * progresso é puramente visual (não reflete nenhum trabalho real).
 */

export function LoadingScreen({
  config,
  context,
}: ComponentProps<LoadingScreenSchema>): JSX.Element {
  const duration = config.durationMs ?? 3000;

  useEffect(() => {
    const advanceTimer = window.setTimeout(() => {
      context.advance();
    }, duration);

    return () => {
      window.clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const variant = config.variant ?? 'spinner';

  if (variant === 'bar') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] bg-quiz-bg py-6 text-center',
          config.className,
        )}
        role="status"
        aria-live="polite"
      >
        {config.text && (
          <h2 className="text-lg font-extrabold text-quiz-fg">{config.text}</h2>
        )}
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-quiz-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-busy="true"
        >
          <div
            className="h-full origin-left rounded-full bg-quiz-accent"
            style={{ animation: `${duration}ms linear forwards quiz-loading-fill` }}
          />
        </div>
        {config.subtext && (
          <p className="text-base text-quiz-fg/70 text-sm">{config.subtext}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5 rounded-[var(--radius)] bg-quiz-bg py-10 text-center',
        config.className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="h-12 w-12 animate-spin rounded-full border-4 border-quiz-muted border-t-quiz-accent"
      />
      {config.text && (
        <h2 className="text-lg font-semibold text-quiz-fg">{config.text}</h2>
      )}
      {config.subtext && (
        <p className="max-w-xs text-base text-quiz-fg/70">{config.subtext}</p>
      )}
      <div
        className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-quiz-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-busy="true"
      >
        <div
          className="h-full origin-left bg-quiz-accent"
          style={{ animation: `${duration}ms linear forwards quiz-loading-fill` }}
        />
      </div>
    </div>
  );
}
