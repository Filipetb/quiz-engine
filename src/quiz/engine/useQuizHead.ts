import { useEffect } from 'react';

import type { QuizHead } from '@/quiz/engine/types';

/**
 * Injeta `preload` / `dns-prefetch` / script inline do quiz em `document.head`.
 *
 * Escopo por quiz: as tags vêm do `head` do schema, então só entram quando
 * aquele quiz específico carrega — um preload de VSL de um quiz nunca vaza
 * para outro. Dedup por marcador para sobreviver a re-render sem duplicar,
 * e cleanup no unmount ao trocar de quiz.
 */

const MARK = 'data-pq-head';

export function useQuizHead(head: QuizHead | undefined, quizId: string): void {
  useEffect(() => {
    if (!head) return;
    const added: Element[] = [];

    const addLink = (
      rel: string,
      href: string,
      as?: string,
      crossorigin?: string,
    ) => {
      const key = `${rel}:${href}`;
      if (document.head.querySelector(`link[${MARK}="${key}"]`)) return;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (as) link.setAttribute('as', as);
      if (crossorigin != null) link.setAttribute('crossorigin', crossorigin);
      link.setAttribute(MARK, key);
      document.head.appendChild(link);
      added.push(link);
    };

    (head.dnsPrefetch ?? []).forEach((href) => addLink('dns-prefetch', href));
    (head.preload ?? []).forEach((p) =>
      addLink('preload', p.href, p.as, p.crossorigin),
    );

    if (head.inlineScript) {
      const key = `inline:${quizId}`;
      if (!document.head.querySelector(`script[${MARK}="${key}"]`)) {
        const script = document.createElement('script');
        script.text = head.inlineScript;
        script.setAttribute(MARK, key);
        document.head.appendChild(script);
        added.push(script);
      }
    }

    return () => {
      added.forEach((el) => el.remove());
    };
  }, [head, quizId]);
}
