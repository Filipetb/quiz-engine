import { Fragment, useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  StatBarsComponent as StatBarsSchema,
  VariableValue,
} from '@/quiz/engine/types';

const BAR_COLOR: Record<NonNullable<StatBarsSchema['items'][number]['color']>, string> = {
  accent: 'bg-quiz-accent',
  success: 'bg-emerald-500',
};

const BADGE_VARIANT: Record<
  NonNullable<StatBarsSchema['items'][number]['badgeVariant']>,
  string
> = {
  muted: 'border border-quiz-muted bg-quiz-bg text-quiz-fg',
  accent: 'border border-quiz-accent bg-quiz-accent text-quiz-accent-fg',
};

const INTERP_PATTERN = /\{{1,2}(\w+)\}{1,2}/g;
const HIGHLIGHT_PATTERN = /\*\*([^*]+)\*\*/g;

function interpolate(
  template: string,
  vars: Record<string, VariableValue>,
): string {
  return template.replace(INTERP_PATTERN, (_, key: string) => {
    const v = vars[key];
    if (v === null || v === undefined || v === '') return '';
    return String(v);
  });
}

function renderWithHighlight(text: string): JSX.Element[] {
  const nodes: JSX.Element[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  HIGHLIGHT_PATTERN.lastIndex = 0;
  while ((match = HIGHLIGHT_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    nodes.push(
      <strong key={key++} className="font-bold text-quiz-fg">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

export function StatBars({
  config,
  context,
}: ComponentProps<StatBarsSchema>): JSX.Element {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setAnimated(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const barHeight = config.barHeight ?? '7rem';

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 py-[0.125rem]',
        config.className,
      )}
    >
      {config.items.map((item, i) => {
        const badgeText = interpolate(item.badge, context.variables);
        const captionText = item.caption
          ? interpolate(item.caption, context.variables)
          : null;
        const fillClass = BAR_COLOR[item.color ?? 'accent'];
        const badgeClass = BADGE_VARIANT[item.badgeVariant ?? 'muted'];
        const pct = Math.max(0, Math.min(100, item.percent));
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-4 rounded-xl border border-quiz-muted p-4"
          >
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold',
                badgeClass,
              )}
            >
              {badgeText}
            </span>
            <div
              className="relative flex w-10 items-end overflow-hidden rounded-lg bg-quiz-muted/40"
              style={{ height: barHeight }}
              role="img"
              aria-label={`${badgeText} ${pct}%`}
            >
              <div
                className={cn(
                  'w-full rounded-lg transition-[height] duration-[1200ms] ease-out',
                  fillClass,
                )}
                style={{ height: `${animated ? pct : 0}%` }}
              />
            </div>
            {captionText && (
              <p className="text-center text-sm leading-tight text-quiz-fg/70">
                {renderWithHighlight(captionText)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
