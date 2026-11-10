import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  ImageComponent as ImageSchema,
} from '@/quiz/engine/types';

export function Image({ config }: ComponentProps<ImageSchema>): JSX.Element {
  if (!config.aspectRatio) {
    return (
      <img
        src={config.src}
        alt={config.alt ?? ''}
        loading="lazy"
        decoding="async"
        className={cn(
          'block h-auto w-full rounded-[var(--radius)]',
          config.className,
        )}
      />
    );
  }
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-[var(--radius)] bg-quiz-muted/40',
        config.className,
      )}
      style={{ aspectRatio: config.aspectRatio }}
    >
      <img
        src={config.src}
        alt={config.alt ?? ''}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </figure>
  );
}
