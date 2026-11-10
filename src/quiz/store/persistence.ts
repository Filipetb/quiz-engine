import { z } from 'zod';

import type { VariableValue } from '@/quiz/engine/types';

/**
 * Persistência da sessão do quiz (PRD §8.5 / §15).
 *
 * Guarda o progresso em `localStorage` com TTL de 24h. Reabrir o quiz dentro
 * da janela retoma onde parou; fora dela começa do zero.
 *
 * Invalidamos a sessão em três situações:
 * - TTL expirado (`now - lastSeenAt > SESSION_TTL_MS`)
 * - `PERSIST_VERSION` bumpado (mudança incompatível no formato do snapshot)
 * - `quiz.version` do schema mudou (autor quebrou a compatibilidade do funil)
 */

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const PERSIST_VERSION = 1;
const STORAGE_PREFIX = 'pq.session.';

const variableValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

const persistedSessionSchema = z.object({
  v: z.literal(PERSIST_VERSION),
  slug: z.string().min(1),
  quizId: z.string().min(1),
  quizVersion: z.number().int().positive(),
  sessionId: z.string().min(1),
  currentStepId: z.string().min(1),
  history: z.array(z.string().min(1)).min(1),
  variables: z.record(z.string(), variableValueSchema),
  startedAt: z.number().int(),
  lastSeenAt: z.number().int(),
  isStarted: z.boolean(),
  isCompleted: z.boolean(),
});

export type PersistedSession = z.infer<typeof persistedSessionSchema>;

export interface SessionSnapshot {
  slug: string;
  quizId: string;
  quizVersion: number;
  sessionId: string;
  currentStepId: string;
  history: string[];
  variables: Record<string, VariableValue>;
  startedAt: number;
  lastSeenAt: number;
  isStarted: boolean;
  isCompleted: boolean;
}

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSession(
  slug: string,
  expectedQuizId: string,
  expectedQuizVersion: number,
  now: number = Date.now(),
): SessionSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(storageKey(slug));
  if (!raw) return null;
  try {
    const parsed = persistedSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      storage.removeItem(storageKey(slug));
      return null;
    }
    const { v: _v, ...snapshot } = parsed.data;
    if (snapshot.quizId !== expectedQuizId) return null;
    if (snapshot.quizVersion !== expectedQuizVersion) {
      storage.removeItem(storageKey(slug));
      return null;
    }
    if (now - snapshot.lastSeenAt > SESSION_TTL_MS) {
      storage.removeItem(storageKey(slug));
      return null;
    }
    return snapshot;
  } catch {
    storage.removeItem(storageKey(slug));
    return null;
  }
}

export function saveSession(snapshot: SessionSnapshot): void {
  const storage = getStorage();
  if (!storage) return;
  const payload: PersistedSession = { v: PERSIST_VERSION, ...snapshot };
  try {
    storage.setItem(storageKey(snapshot.slug), JSON.stringify(payload));
  } catch {
    // QuotaExceeded / storage privativo: ignora silenciosamente.
  }
}

export function clearSession(slug: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(slug));
  } catch {
    // no-op
  }
}
