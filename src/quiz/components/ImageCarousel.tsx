import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  ImageCarouselComponent as ImageCarouselSchema,
} from '@/quiz/engine/types';

export function ImageCarousel({
  config,
}: ComponentProps<ImageCarouselSchema>): JSX.Element {
  const [index, setIndex] = useState(0);
  const total = config.images.length;
  const autoPlay = config.autoPlay ?? false;
  const interval = config.intervalMs ?? 4000;

  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total],
  );

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = window.setInterval(next, interval);
    return () => window.clearInterval(id);
  }, [autoPlay, interval, next, total]);

  const current = config.images[index];
  const aspectStyle = config.aspectRatio
    ? { aspectRatio: config.aspectRatio }
    : undefined;

  return (
    <div className={cn('flex flex-col gap-3', config.className)}>
      <div
        className="relative overflow-hidden rounded-[var(--radius)] bg-quiz-muted/40"
        style={aspectStyle}
      >
        <img
          src={current.src}
          alt={current.alt ?? ''}
          loading="lazy"
          className="h-full w-full object-cover transition-opacity duration-300"
          key={index}
        />
        {/* {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próximo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ›
            </button>
          </>
        )} */}
      </div>
      {current.caption && (
        <p className="text-center text-base text-quiz-fg/70">{current.caption}</p>
      )}
      {total > 1 && (
        <div className="flex justify-center gap-2">
          {config.images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
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
