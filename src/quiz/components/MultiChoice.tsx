import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  MultiChoiceComponent as MultiChoiceSchema,
} from '@/quiz/engine/types';

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

export function MultiChoice({
  config,
  context,
}: ComponentProps<MultiChoiceSchema>): JSX.Element {
  const selected = asArray(context.variables[config.variable]);
  const minSelected = config.minSelected ?? 1;
  const maxSelected = config.maxSelected ?? config.options.length;
  const canContinue = selected.length >= minSelected;

  function toggle(value: string): void {
    const has = selected.includes(value);
    let next: string[];
    if (has) {
      next = selected.filter((v) => v !== value);
    } else if (selected.length >= maxSelected) {
      return;
    } else {
      next = [...selected, value];
    }
    context.setVariable(config.variable, next);
  }

  return (
    <div className={cn('flex flex-col gap-3', config.className)}>
      <div role="group" aria-label={config.variable} className="flex flex-col gap-2">
        {config.options.map((option) => {
          const isSelected = selected.includes(option.value);
          const isPrepend =
            (config.imageLayout ?? 'grid') === 'prepend' && !!option.imageSrc;
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(option.value)}
              className={cn(
                'flex items-center gap-3 overflow-hidden rounded-[var(--radius)] border bg-quiz-bg text-left text-base font-medium text-quiz-fg transition-colors',
                isPrepend ? 'p-0 pr-3' : 'p-3',
                'hover:border-quiz-accent hover:bg-quiz-accent/5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2',
                isSelected
                  ? 'border-quiz-accent bg-quiz-accent/10'
                  : 'border-quiz-muted',
              )}
            >
              {isPrepend && (
                <div className="aspect-square h-14 w-14 shrink-0 overflow-hidden bg-quiz-muted/40">
                  <img
                    src={option.imageSrc}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <span className="flex-1">{option.label}</span>
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold',
                  isSelected
                    ? 'border-quiz-accent bg-quiz-accent text-quiz-accent-fg'
                    : 'border-quiz-muted bg-quiz-bg',
                )}
              >
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => context.advance()}
        disabled={!canContinue}
        className="quiz-btn-primary"
      >
        {config.continueLabel ?? 'Continuar'}
      </button>
    </div>
  );
}
