import { Fragment } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  HeadingComponent as HeadingSchema,
  VariableValue,
} from '@/quiz/engine/types';

const LEVEL_CLASSES: Record<1 | 2 | 3, string> = {
  1: 'text-2xl font-extrabold tracking-tight text-quiz-fg sm:text-3xl',
  2: 'text-xl font-extrabold tracking-tight text-quiz-fg sm:text-2xl',
  3: 'text-base font-extrabold text-quiz-fg/90 sm:text-lg',
};

const INTERP_PATTERN = /\{{1,2}(\w+)\}{1,2}/g;
const HIGHLIGHT_PATTERN = /\*\*([^*]+)\*\*/g;

function interpolate(
  template: string,
  vars: Record<string, VariableValue>,
): string {
  return template.replace(INTERP_PATTERN, (_, key: string) => {
    const v = vars[key];
    if (v === null || v === undefined || v === '') return '';
    return String(v);
  });
}

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
      <span key={key++} className="text-quiz-accent">
        {match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

export function Heading({
  config,
  context,
}: ComponentProps<HeadingSchema>): JSX.Element {
  const level = config.level ?? 1;
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
  const resolved = interpolate(config.text, context.variables);
  return (
    <Tag className={cn(LEVEL_CLASSES[level], config.className)}>
      {renderWithHighlight(resolved)}
    </Tag>
  );
}
