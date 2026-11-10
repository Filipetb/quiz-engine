import { Fragment } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  CalloutVariant,
  ComponentProps,
  CalloutComponent as CalloutSchema,
} from '@/quiz/engine/types';

const VARIANT_CONTAINER: Record<CalloutVariant, string> = {
  success: 'bg-emerald-50',
  info: 'bg-blue-50',
  warning: 'bg-amber-50',
  danger: 'bg-rose-50',
  accent: 'bg-pink-50',
};

const VARIANT_TITLE: Record<CalloutVariant, string> = {
  success: 'text-emerald-700',
  info: 'text-blue-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
  accent: 'text-pink-700',
};

const VARIANT_BODY: Record<CalloutVariant, string> = {
  success: 'text-emerald-800/80',
  info: 'text-blue-800/80',
  warning: 'text-amber-800/80',
  danger: 'text-rose-800/80',
  accent: 'text-pink-800/80',
};

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
      <strong key={key++} className="font-extrabold">
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

export function Callout({
  config,
}: ComponentProps<CalloutSchema>): JSX.Element {
  const variant = config.variant ?? 'success';
  const align = config.alignment ?? 'center';
  const alignClass = align === 'center' ? 'text-center' : 'text-left';
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] p-5',
        VARIANT_CONTAINER[variant],
        config.className,
      )}
    >
      {config.title && (
        <h3
          className={cn(
            'text-lg font-extrabold leading-tight',
            VARIANT_TITLE[variant],
            alignClass,
          )}
        >
          {renderWithHighlight(config.title)}
        </h3>
      )}
      {config.body && (
        <p
          className={cn(
            'text-base leading-relaxed',
            VARIANT_BODY[variant],
            config.title && 'mt-2',
            alignClass,
          )}
        >
          {renderWithHighlight(config.body)}
        </p>
      )}
    </div>
  );
}
