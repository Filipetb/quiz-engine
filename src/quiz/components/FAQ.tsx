import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  FAQComponent as FAQSchema,
} from '@/quiz/engine/types';

export function FAQ({ config }: ComponentProps<FAQSchema>): JSX.Element {
  return (
    <div className={cn('flex flex-col divide-y divide-quiz-muted', config.className)}>
      {config.items.map((item, i) => (
        <div key={i} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          {item.icon && (
            <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden>
              {item.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-snug text-quiz-fg">
              {item.question}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-quiz-fg/70">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
