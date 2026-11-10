import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  PricingCardComponent as PricingCardSchema,
} from '@/quiz/engine/types';

export function PricingCard({
  config,
}: ComponentProps<PricingCardSchema>): JSX.Element {
  const badgeStyle = config.badgeColor
    ? { backgroundColor: config.badgeColor }
    : undefined;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-quiz-muted',
        config.className,
      )}
    >
      <div
        className="bg-quiz-accent px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
        style={badgeStyle}
      >
        {config.badge}
      </div>

      <div className="flex items-center gap-4 px-3 py-3 bg-[#DCFCE7]">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-quiz-fg">{config.planName}</p>
          <div className="mt-1 flex items-center gap-2 text-base">
            <span className="text-quiz-fg/50 line-through font-bold text-lg">
              {config.originalPrice}
            </span>
            <span aria-hidden className="text-quiz-accent">➡️</span>
            <span className="text-xl font-bold text-quiz-fg text-[#15803D]">
              {config.price}
            </span>
          </div>
        </div>

        {config.dailyPrice && (
          <div className="shrink-0 rounded-lg border-2 border-dashed border-quiz-muted px-3 py-2 text-center bg-[#D1F0DD]">
            {config.dailyLabel && (
              <p className="text-xs text-quiz-fg/60 text-left">{config.dailyLabel}</p>
            )}
            <p className="text-2xl font-bold leading-tight text-[#15803D]">
              {config.dailyPrice}
            </p>
            {config.dailySuffix && (
              <p className="text-xs text-quiz-fg/60 text-right">{config.dailySuffix}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
