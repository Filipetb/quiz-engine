import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SESSION_TTL_MS,
  type SessionSnapshot,
  clearSession,
  loadSession,
  saveSession,
} from './persistence';

const baseSnapshot: SessionSnapshot = {
  slug: 'advanced',
  quizId: 'advanced',
  quizVersion: 1,
  sessionId: 'sess-xyz',
  currentStepId: 'step-height',
  history: ['step-age', 'step-height'],
  variables: { age: 30, height_cm: 175, bmi: 24 },
  startedAt: 1_700_000_000_000,
  lastSeenAt: 1_700_000_000_000,
  isStarted: true,
  isCompleted: false,
};

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe('persistence', () => {
  it('retorna null quando não há sessão', () => {
    expect(loadSession('advanced', 'advanced', 1)).toBeNull();
  });

  it('round-trip save/load preserva dados', () => {
    saveSession(baseSnapshot);
    const loaded = loadSession(
      'advanced',
      'advanced',
      1,
      baseSnapshot.lastSeenAt + 1_000,
    );
    expect(loaded).toEqual(baseSnapshot);
  });

  it('invalida e descarta quando TTL (24h) expirou', () => {
    saveSession(baseSnapshot);
    const loaded = loadSession(
      'advanced',
      'advanced',
      1,
      baseSnapshot.lastSeenAt + SESSION_TTL_MS + 1,
    );
    expect(loaded).toBeNull();
    expect(window.localStorage.getItem('pq.session.advanced')).toBeNull();
  });

  it('invalida quando quizVersion do schema mudou', () => {
    saveSession(baseSnapshot);
    const loaded = loadSession(
      'advanced',
      'advanced',
      2,
      baseSnapshot.lastSeenAt,
    );
    expect(loaded).toBeNull();
    expect(window.localStorage.getItem('pq.session.advanced')).toBeNull();
  });

  it('retorna null (sem descartar) quando quizId do schema difere', () => {
    saveSession(baseSnapshot);
    const loaded = loadSession(
      'advanced',
      'outro-quiz',
      1,
      baseSnapshot.lastSeenAt,
    );
    expect(loaded).toBeNull();
    expect(window.localStorage.getItem('pq.session.advanced')).not.toBeNull();
  });

  it('descarta storage corrompido', () => {
    window.localStorage.setItem('pq.session.advanced', '{not json}');
    expect(loadSession('advanced', 'advanced', 1)).toBeNull();
    expect(window.localStorage.getItem('pq.session.advanced')).toBeNull();
  });

  it('descarta quando shape zod falha', () => {
    window.localStorage.setItem(
      'pq.session.advanced',
      JSON.stringify({ foo: 'bar' }),
    );
    expect(loadSession('advanced', 'advanced', 1)).toBeNull();
    expect(window.localStorage.getItem('pq.session.advanced')).toBeNull();
  });

  it('clearSession remove entrada', () => {
    saveSession(baseSnapshot);
    clearSession('advanced');
    expect(window.localStorage.getItem('pq.session.advanced')).toBeNull();
  });

  it('scope por slug — sessões de quizzes diferentes não colidem', () => {
    saveSession(baseSnapshot);
    saveSession({ ...baseSnapshot, slug: 'playground', quizId: 'playground' });
    const a = loadSession('advanced', 'advanced', 1, baseSnapshot.lastSeenAt);
    const b = loadSession(
      'playground',
      'playground',
      1,
      baseSnapshot.lastSeenAt,
    );
    expect(a?.slug).toBe('advanced');
    expect(b?.slug).toBe('playground');
  });
});
