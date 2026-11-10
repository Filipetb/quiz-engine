import { useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';
import { useQuizSession } from '@/quiz/store/session';

/**
 * Banner que aparece 1x quando o runtime restaura uma sessão salva
 * (PRD §8.5 / §15). Não é um componente do schema — o autor do quiz não
 * precisa posicionar nada; o runtime cuida.
 *
 * Auto-dismiss em 7s. Ao dismissar, `wasResumed` volta pra false e ele
 * só aparece de novo se o usuário sair/entrar de novo dentro das 24h.
 */

const AUTO_DISMISS_MS = 7_000;
const FADE_MS = 220;

export function ResumeToast(): JSX.Element | null {
  const wasResumed = useQuizSession((s) => s.wasResumed);
  const dismiss = useQuizSession((s) => s.dismissResume);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!wasResumed) return;
    setMounted(true);
    const enter = window.setTimeout(() => setVisible(true), 10);
    const auto = window.setTimeout(() => handleDismiss(), AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(auto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasResumed]);

  function handleDismiss(): void {
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
      dismiss();
    }, FADE_MS);
  }

  if (!wasResumed && !mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-quiz-accent/20 bg-quiz-accent px-4 py-2 text-sm text-quiz-accent-fg shadow-lg transition-all duration-200',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
        )}
      >
        <span className="text-base" aria-hidden>
          ↺
        </span>
        <span className="flex-1">Retomamos donde te quedaste.</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full px-2 py-0.5 text-xs font-medium opacity-80 transition hover:opacity-100"
          aria-label="Fechar aviso"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
