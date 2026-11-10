import { useMemo, type ReactNode } from 'react';

import type { ThemeTokens } from './types';

/**
 * Aplica as cores do theme do schema como CSS variables em um container.
 * Usa os tokens do Tailwind (`quiz.bg`, `quiz.fg`, etc. — definidos em
 * `tailwind.config.ts`), convertendo strings HSL (`"222 47% 11%"`) para
 * variáveis CSS. Valores não-HSL passam direto.
 */

interface Props {
  theme?: ThemeTokens;
  children: ReactNode;
  className?: string;
}

type CSSVarStyle = React.CSSProperties & Record<`--${string}`, string>;

export function QuizThemeProvider({
  theme,
  children,
  className,
}: Props): JSX.Element {
  const style = useMemo<CSSVarStyle | undefined>(() => {
    if (!theme?.colors && !theme?.radius && !theme?.fonts) return undefined;
    const s: CSSVarStyle = {};
    const colors = theme.colors ?? {};
    if (colors.bg) s['--quiz-bg'] = colors.bg;
    if (colors.fg) s['--quiz-fg'] = colors.fg;
    if (colors.accent) s['--quiz-accent'] = colors.accent;
    if (colors.accentFg) s['--quiz-accent-fg'] = colors.accentFg;
    if (colors.muted) s['--quiz-muted'] = colors.muted;
    if (theme.radius) s['--radius'] = theme.radius;
    if (theme.fonts?.sans) s.fontFamily = theme.fonts.sans;
    return s;
  }, [theme]);

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
