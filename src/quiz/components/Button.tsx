import type { CSSProperties } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ButtonComponent as ButtonSchema,
  ComponentProps,
} from '@/quiz/engine/types';

const BASE =
  'inline-flex h-14 w-full items-center justify-center rounded-md px-6 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quiz-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<'primary' | 'secondary' | 'ghost' | 'raised', string> = {
  primary: 'bg-quiz-accent text-quiz-accent-fg hover:bg-quiz-accent/90',
  secondary:
    'bg-quiz-muted text-quiz-fg hover:bg-quiz-muted/80 border border-quiz-muted',
  ghost: 'bg-transparent text-quiz-fg hover:bg-quiz-muted/60',
  raised: 'bg-quiz-accent text-quiz-accent-fg quiz-btn-raised',
};

export function Button({
  config,
  context,
}: ComponentProps<ButtonSchema>): JSX.Element {
  const variant = config.variant ?? 'primary';

  const colorStyle: CSSProperties | undefined = config.color
    ? ({
        backgroundColor: config.color,
        color: '#fff',
        ['--btn-bg' as string]: config.color,
      } as CSSProperties)
    : undefined;

  if (config.href) {
    const target = config.target ?? '_self';
    const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
    const handleClick = () => context.trackCtaClick();
    if (variant === 'hero') {
      return (
        <>
          <div aria-hidden className="quiz-btn-hero-spacer" />
          <a
            href={config.href}
            target={target}
            rel={rel}
            onClick={handleClick}
            className={cn(
              BASE,
              VARIANTS.primary,
              'quiz-btn-hero',
              config.className,
            )}
            style={colorStyle}
          >
            {config.label}
          </a>
        </>
      );
    }
    return (
      <a
        href={config.href}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={cn(BASE, VARIANTS[variant], config.className)}
        style={colorStyle}
      >
        {config.label}
      </a>
    );
  }

  const isBack = config.action === 'back';
  const disabled = isBack && context.isFirstStep;
  const onClick = () => {
    if (isBack) context.back();
    else context.advance();
  };

  if (variant === 'hero') {
    return (
      <>
        <div aria-hidden className="quiz-btn-hero-spacer" />
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(BASE, VARIANTS.primary, 'quiz-btn-hero', config.className)}
          style={colorStyle}
        >
          {config.label}
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(BASE, VARIANTS[variant], config.className)}
      style={colorStyle}
    >
      {config.label}
    </button>
  );
}
