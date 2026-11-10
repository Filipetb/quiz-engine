import { create } from 'zustand';

import { evaluateExpression } from '@/quiz/engine/compute';
import type {
  QuizSchema,
  StepSchema,
  VariableValue,
} from '@/quiz/engine/types';

import {
  clearSession,
  loadSession,
  saveSession,
  type SessionSnapshot,
} from './persistence';

/**
 * Store de sessão do runtime.
 *
 * A persistência de 24h (PRD §8.5 / §15) mora em `persistence.ts`; aqui só
 * decidimos *quando* hidratar/gravar/limpar. Toda ação que muda estado
 * relevante (setVariable, advance, back) grava o snapshot em localStorage.
 */

export interface QuizSessionState {
  slug: string | null;
  quizId: string | null;
  quizVersion: number | null;
  sessionId: string | null;
  startedAt: number | null;
  lastSeenAt: number | null;
  currentStepId: string | null;
  /** Stack de ids de steps visitados, em ordem cronológica. */
  history: string[];
  variables: Record<string, VariableValue>;
  /** Flag interna — true após a primeira transição válida (usada no quiz_start). */
  isStarted: boolean;
  isCompleted: boolean;
  /**
   * Verdadeiro quando a sessão foi restaurada do storage no último `initialize`.
   * O ResumeToast consome (via `dismissResume`) para só aparecer uma vez.
   */
  wasResumed: boolean;
}

export interface QuizSessionActions {
  initialize: (schema: QuizSchema, options?: { slug?: string }) => void;
  setVariable: (key: string, value: VariableValue) => void;
  advance: (explicitNext?: string) => void;
  back: () => void;
  reset: () => void;
  dismissResume: () => void;
}

export type QuizSessionStore = QuizSessionState & QuizSessionActions;

const emptyState: QuizSessionState = {
  slug: null,
  quizId: null,
  quizVersion: null,
  sessionId: null,
  startedAt: null,
  lastSeenAt: null,
  currentStepId: null,
  history: [],
  variables: {},
  isStarted: false,
  isCompleted: false,
  wasResumed: false,
};

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function applyComputedVariables(
  variables: Record<string, VariableValue>,
  schema: QuizSchema,
): Record<string, VariableValue> {
  if (!schema.variables) return variables;
  const next = { ...variables };
  for (const [key, def] of Object.entries(schema.variables)) {
    if (!def.compute) continue;
    const result = evaluateExpression(def.compute, next);
    next[key] = result;
  }
  return next;
}

function buildInitialVariables(
  schema: QuizSchema,
): Record<string, VariableValue> {
  const vars: Record<string, VariableValue> = {};
  if (!schema.variables) return vars;
  for (const [key, def] of Object.entries(schema.variables)) {
    vars[key] = def.default ?? null;
  }
  return applyComputedVariables(vars, schema);
}

function resolveNextStepId(
  schema: QuizSchema,
  current: StepSchema,
  explicitNext?: string,
): string | null {
  if (explicitNext) return explicitNext;
  if (current.actions?.next) return current.actions.next;
  const idx = schema.steps.findIndex((s) => s.id === current.id);
  if (idx === -1 || idx + 1 >= schema.steps.length) return null;
  return schema.steps[idx + 1].id;
}

function resolveSlug(schema: QuizSchema, explicit?: string): string {
  return explicit ?? schema.quiz.slug ?? schema.quiz.id;
}

function snapshotFromState(state: QuizSessionState): SessionSnapshot | null {
  if (
    !state.slug ||
    !state.quizId ||
    state.quizVersion === null ||
    !state.sessionId ||
    !state.currentStepId ||
    state.startedAt === null ||
    state.lastSeenAt === null ||
    state.history.length === 0
  ) {
    return null;
  }
  return {
    slug: state.slug,
    quizId: state.quizId,
    quizVersion: state.quizVersion,
    sessionId: state.sessionId,
    currentStepId: state.currentStepId,
    history: state.history,
    variables: state.variables,
    startedAt: state.startedAt,
    lastSeenAt: state.lastSeenAt,
    isStarted: state.isStarted,
    isCompleted: state.isCompleted,
  };
}

// Mantemos referência ao schema ativo fora do state — ele não é serializável
// nem precisa disparar re-renders quando muda.
let activeSchema: QuizSchema | null = null;

export function getActiveSchema(): QuizSchema | null {
  return activeSchema;
}

export const useQuizSession = create<QuizSessionStore>((set, get) => ({
  ...emptyState,

  initialize: (schema, options) => {
    activeSchema = schema;
    const firstStep = schema.steps[0];
    if (!firstStep) return;
    const slug = resolveSlug(schema, options?.slug);
    const now = Date.now();
    const restored = loadSession(slug, schema.quiz.id, schema.quiz.version);
    if (restored) {
      const stepExists = schema.steps.some(
        (s) => s.id === restored.currentStepId,
      );
      if (stepExists) {
        // Reaplica `compute` caso a lógica tenha evoluído.
        const variables = applyComputedVariables(restored.variables, schema);
        const isOnFirstStep = restored.currentStepId === firstStep.id;
        set({
          slug,
          quizId: restored.quizId,
          quizVersion: restored.quizVersion,
          sessionId: restored.sessionId,
          startedAt: restored.startedAt,
          lastSeenAt: now,
          currentStepId: restored.currentStepId,
          history: restored.history,
          variables,
          isStarted: restored.isStarted,
          isCompleted: restored.isCompleted,
          wasResumed: !restored.isCompleted && !isOnFirstStep,
        });
        const next = snapshotFromState(get());
        if (next) saveSession(next);
        return;
      }
      // step some schema mudou: descarta sessão.
      clearSession(slug);
    }
    set({
      ...emptyState,
      slug,
      quizId: schema.quiz.id,
      quizVersion: schema.quiz.version,
      sessionId: generateSessionId(),
      startedAt: now,
      lastSeenAt: now,
      currentStepId: firstStep.id,
      history: [firstStep.id],
      variables: buildInitialVariables(schema),
    });
    const fresh = snapshotFromState(get());
    if (fresh) saveSession(fresh);
  },

  setVariable: (key, value) => {
    const schema = activeSchema;
    set((state) => {
      const nextVars = { ...state.variables, [key]: value };
      const withComputed = schema
        ? applyComputedVariables(nextVars, schema)
        : nextVars;
      return {
        variables: withComputed,
        lastSeenAt: Date.now(),
      };
    });
    const snap = snapshotFromState(get());
    if (snap) saveSession(snap);
  },

  advance: (explicitNext) => {
    const schema = activeSchema;
    if (!schema) return;
    const state = get();
    const current = schema.steps.find((s) => s.id === state.currentStepId);
    if (!current) return;
    const nextId = resolveNextStepId(schema, current, explicitNext);
    const now = Date.now();
    if (!nextId) {
      set({
        isCompleted: true,
        lastSeenAt: now,
      });
    } else {
      set({
        currentStepId: nextId,
        history: [...state.history, nextId],
        lastSeenAt: now,
        isStarted: true,
      });
    }
    const snap = snapshotFromState(get());
    if (snap) saveSession(snap);
  },

  back: () => {
    const state = get();
    if (state.history.length <= 1) return;
    const nextHistory = state.history.slice(0, -1);
    const previousId = nextHistory[nextHistory.length - 1];
    set({
      currentStepId: previousId,
      history: nextHistory,
      lastSeenAt: Date.now(),
      isCompleted: false,
    });
    const snap = snapshotFromState(get());
    if (snap) saveSession(snap);
  },

  reset: () => {
    const state = get();
    if (state.slug) clearSession(state.slug);
    activeSchema = null;
    set({ ...emptyState });
  },

  dismissResume: () => {
    set({ wasResumed: false });
  },
}));

/* ─────────────────────── Selectors utilitários ─────────────────────── */

export function useCurrentStep(): StepSchema | null {
  const currentStepId = useQuizSession((s) => s.currentStepId);
  if (!currentStepId) return null;
  const schema = activeSchema;
  if (!schema) return null;
  return schema.steps.find((s) => s.id === currentStepId) ?? null;
}

export function computeProgress(
  schema: QuizSchema,
  currentStepId: string | null,
): number {
  if (!currentStepId) return 0;
  const step = schema.steps.find((s) => s.id === currentStepId);
  if (!step) return 0;
  if (typeof step.progress === 'number') return step.progress;
  if (schema.steps.length <= 1) return 1;
  return step.order / (schema.steps.length - 1);
}
