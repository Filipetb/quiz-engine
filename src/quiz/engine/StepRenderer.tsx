import { useCallback, useMemo } from 'react';

import { ResumeToast } from '@/quiz/components/ResumeToast';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils/cn';

import { renderComponent } from './registry';
import type { QuizSchema, RuntimeContext } from './types';
import {
  computeProgress,
  useCurrentStep,
  useQuizSession,
} from '@/quiz/store/session';
import { enqueueEvent, flushNow, pushToDataLayer } from '@/quiz/tracking/client';
import { QUIZ_EVENTS } from '@/quiz/tracking/events';

interface Props {
  schema: QuizSchema;
}

export function StepRenderer({ schema }: Props): JSX.Element | null {
  const session = useQuizSession();
  const currentStep = useCurrentStep();
  const progress = useMemo(
    () => computeProgress(schema, session.currentStepId),
    [schema, session.currentStepId],
  );

  const trackCtaClick = useCallback(() => {
    if (!session.sessionId || !session.slug || !currentStep) return;
    const event = {
      event_name: QUIZ_EVENTS.QUIZ_COMPLETE_CTA_CLICK,
      quiz_slug: session.slug,
      session_token: session.sessionId,
      step_id: currentStep.id,
      step_order: currentStep.order,
    };
    enqueueEvent(event);
    pushToDataLayer(event);
    flushNow();
  }, [session.sessionId, session.slug, currentStep]);

  if (!currentStep) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Inicializando quiz…
      </div>
    );
  }

  if (session.isCompleted) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Quiz concluído</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Você chegou ao fim do funil. O CTA final redireciona para o checkout
          externo (Etapa 5).
        </p>
        <Button variant="outline" onClick={session.reset}>
          Recomeçar
        </Button>
      </div>
    );
  }

  const steps = schema.steps;
  const currentIndex = steps.findIndex((s) => s.id === currentStep.id);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex === steps.length - 1;

  const context: RuntimeContext = {
    variables: session.variables,
    setVariable: session.setVariable,
    advance: session.advance,
    back: session.back,
    trackCtaClick,
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
  };

  return (
    <div className="flex min-h-full flex-col bg-quiz-bg text-quiz-fg">
      <ResumeToast />
      {!isFirstStep && (
        <header className="border-b bg-background/60 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-xl items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={session.back}
              aria-label="Voltar"
            >
              ←
            </Button>
            <div className="flex-1">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div
                  className="h-full bg-quiz-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          'mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6',
        )}
      >
        {currentStep.components.map((component, index) => (
          <div key={component.id ?? `${currentStep.id}-${index}`}>
            {renderComponent(component, context)}
          </div>
        ))}
      </main>
    </div>
  );
}
