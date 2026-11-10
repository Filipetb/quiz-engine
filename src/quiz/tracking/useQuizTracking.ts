import { useEffect, useRef } from 'react';

import type { QuizSchema, StepSchema } from '@/quiz/engine/types';
import { useQuizSession } from '@/quiz/store/session';

import {
  enqueueEvent,
  flushNow,
  pushToDataLayer,
  startFlushLoop,
  stopFlushLoop,
} from './client';
import { QUIZ_EVENTS, type TrackEvent } from './events';

function getUtmSource(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get('utm_source') ?? undefined;
}

function getOrigin(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.referrer || undefined;
}

function buildIdempotencyKey(
  sessionToken: string,
  eventName: string,
  stepId?: string,
): string {
  return `${sessionToken}:${eventName}:${stepId ?? '_'}`;
}

function findStep(schema: QuizSchema, stepId: string): StepSchema | undefined {
  return schema.steps.find((s) => s.id === stepId);
}

export function useQuizTracking(schema: QuizSchema | null): void {
  const sessionId = useQuizSession((s) => s.sessionId);
  const slug = useQuizSession((s) => s.slug);
  const currentStepId = useQuizSession((s) => s.currentStepId);
  const isStarted = useQuizSession((s) => s.isStarted);
  const wasResumed = useQuizSession((s) => s.wasResumed);
  const history = useQuizSession((s) => s.history);

  const prevStepRef = useRef<string | null>(null);
  const prevHistoryLenRef = useRef<number>(0);
  const visitFiredRef = useRef(false);
  const startFiredRef = useRef(false);
  const resumeFiredRef = useRef(false);

  const utmSource = useRef(getUtmSource());
  const origin = useRef(getOrigin());

  useEffect(() => {
    startFlushLoop();
    return stopFlushLoop;
  }, []);

  const track = (
    eventName: TrackEvent['event_name'],
    stepId?: string,
    stepOrder?: number,
    idempotencyKey?: string,
    payload?: Record<string, unknown>,
  ) => {
    if (!sessionId || !slug) return;
    const event: TrackEvent = {
      event_name: eventName,
      quiz_slug: slug,
      session_token: sessionId,
      step_id: stepId,
      step_order: stepOrder,
      utm_source: utmSource.current,
      origin: origin.current,
      idempotency_key: idempotencyKey,
      payload,
    };
    enqueueEvent(event);
    pushToDataLayer(event);
  };

  useEffect(() => {
    if (!schema || !sessionId || !slug || !currentStepId) return;

    const step = findStep(schema, currentStepId);
    if (!step) return;

    if (!visitFiredRef.current) {
      visitFiredRef.current = true;
      track(
        QUIZ_EVENTS.QUIZ_VISIT,
        step.id,
        step.order,
        buildIdempotencyKey(sessionId, QUIZ_EVENTS.QUIZ_VISIT),
      );
    }

    if (wasResumed && !resumeFiredRef.current) {
      resumeFiredRef.current = true;
      track(QUIZ_EVENTS.QUIZ_RESUME, step.id, step.order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, sessionId, slug, currentStepId]);

  useEffect(() => {
    if (!schema || !sessionId || !slug || !currentStepId) return;

    const step = findStep(schema, currentStepId);
    if (!step) return;

    if (isStarted && !startFiredRef.current) {
      startFiredRef.current = true;
      track(
        QUIZ_EVENTS.QUIZ_START,
        step.id,
        step.order,
        buildIdempotencyKey(sessionId, QUIZ_EVENTS.QUIZ_START),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  useEffect(() => {
    if (!schema || !sessionId || !slug || !currentStepId) return;

    const step = findStep(schema, currentStepId);
    if (!step) return;

    if (prevStepRef.current === currentStepId) return;

    const prevHistoryLen = prevHistoryLenRef.current;
    const isBack = history.length < prevHistoryLen;
    const isFirst = prevStepRef.current === null;

    prevStepRef.current = currentStepId;
    prevHistoryLenRef.current = history.length;

    track(
      QUIZ_EVENTS.STEP_VIEW,
      step.id,
      step.order,
      buildIdempotencyKey(sessionId, QUIZ_EVENTS.STEP_VIEW, step.id),
    );

    if (!isFirst) {
      if (isBack) {
        track(QUIZ_EVENTS.STEP_BACK, step.id, step.order);
      } else {
        track(QUIZ_EVENTS.STEP_ADVANCE, step.id, step.order);
      }
    }

    flushNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId]);
}
