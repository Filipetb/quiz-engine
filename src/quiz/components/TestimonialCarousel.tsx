import { Fragment, useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  TestimonialCarouselComponent as TestimonialCarouselSchema,
} from '@/quiz/engine/types';

const HIGHLIGHT_PATTERN = /\*\*([^*]+)\*\*/g;

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
      <strong key={key++} className="font-extrabold text-quiz-accent">
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

function Stars({ rating }: { rating: number }): JSX.Element {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            'h-4 w-4',
            i < value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-quiz-muted',
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialCarousel({
  config,
}: ComponentProps<TestimonialCarouselSchema>): JSX.Element {
  const [index, setIndex] = useState(0);
  const total = config.items.length;
  const autoPlay = config.autoPlay ?? false;
  const interval = config.intervalMs ?? 6000;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = window.setInterval(next, interval);
    return () => window.clearInterval(id);
  }, [autoPlay, interval, next, total]);

  const current = config.items[index];

  return (
    <div className={cn('flex flex-col gap-3', config.className)}>
      <article
        key={index}
        className="rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-5"
      >
        <Stars rating={current.rating ?? 5} />
        <h3 className="mt-3 text-base font-extrabold leading-tight text-quiz-fg">
          {renderWithHighlight(current.headline)}
        </h3>
        {current.handle && (
          <p className="mt-1 text-sm text-quiz-fg/60">{current.handle}</p>
        )}
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-quiz-fg/70 text-sm">
          {current.body}
        </p>
      </article>
      {total > 1 && (
        <div className="flex justify-center gap-2">
          {config.items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para depoimento ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index
                  ? 'w-6 bg-quiz-accent'
                  : 'w-2 bg-quiz-muted hover:bg-quiz-muted/60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
