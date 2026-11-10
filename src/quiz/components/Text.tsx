import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  TextComponent as TextSchema,
} from '@/quiz/engine/types';

export function Text({ config }: ComponentProps<TextSchema>): JSX.Element {
  return (
    <p
      className={cn('text-base leading-relaxed text-quiz-fg/80', config.className)}
    >
      {config.text}
    </p>
  );
}
