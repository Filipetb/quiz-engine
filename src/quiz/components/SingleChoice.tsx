import { ChevronRight } from 'lucide-react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  SingleChoiceComponent as SingleChoiceSchema,
} from '@/quiz/engine/types';

export function SingleChoice({
  config,
  context,
}: ComponentProps<SingleChoiceSchema>): JSX.Element {
  const selected = context.variables[config.variable];
  const autoAdvance = config.autoAdvance !== false;
  const hasImages = config.options.some((option) => option.imageSrc);
  const layout = config.imageLayout ?? 'grid';
  const isGridWithImages = hasImages && layout === 'grid';
  const isPrependWithImages = hasImages && layout === 'prepend';

  function onSelect(value: string): void {
    context.setVariable(config.variable, value);
    if (autoAdvance) {
      // Atraso curto pra feedback visual da seleção antes de trocar de step.
      window.setTimeout(() => context.advance(), 180);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={config.variable}
      className={cn(
        'grid gap-3',
        isGridWithImages ? 'grid-cols-2' : 'grid-cols-1',
        config.className,
      )}
    >
      {config.options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'group flex items-center gap-3 overflow-hidden rounded-[var(--radius)] border bg-quiz-bg text-left text-base font-medium text-quiz-fg transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2',
              isGridWithImages
                ? 'flex-col items-stretch gap-0 border-quiz-accent p-0'
                : cn(
                    isPrependWithImages ? 'p-0 pr-3' : 'p-3',
                    'hover:border-quiz-accent hover:bg-quiz-accent/5',
                    isSelected
                      ? 'border-quiz-accent bg-quiz-accent/10 ring-2 ring-quiz-accent/30'
                      : 'border-quiz-muted',
                  ),
            )}
          >
            {isGridWithImages && option.imageSrc && (
              <div className="aspect-square w-full overflow-hidden bg-quiz-muted/40">
                <img
                  src={option.imageSrc}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {isPrependWithImages && option.imageSrc && (
              <div className="aspect-square h-14 w-14 shrink-0 overflow-hidden bg-quiz-muted/40">
                <img
                  src={option.imageSrc}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {isGridWithImages ? (
              <span className="flex items-center justify-between gap-2 bg-quiz-accent px-3 py-2 text-center text-quiz-accent-fg">
                <span className="flex-1">{option.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </span>
            ) : (
              <>
                <span className="flex-1">{option.label}</span>
                {autoAdvance && (
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-quiz-muted text-quiz-fg/70"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
