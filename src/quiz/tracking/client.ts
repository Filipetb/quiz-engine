import type { TrackEvent } from './events';

const FLUSH_INTERVAL_MS = 500;
const TRACK_ENDPOINT = import.meta.env.VITE_TRACK_ENDPOINT as string;

let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function send(events: TrackEvent[]): void {
  if (events.length === 0) return;

  const body = JSON.stringify(events.length === 1 ? events[0] : events);

  // text/plain evita preflight OPTIONS (CORS simple request). O backend faz
  // JSON.parse do corpo cru — mesmo truque usado em outros projetos nossos.
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    const sent = navigator.sendBeacon(TRACK_ENDPOINT, blob);
    if (sent) return;
  }

  fetch(TRACK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {
    // tracking never blocks navigation (PRD §11.2)
  });
}

function flush(): void {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  for (const event of batch) {
    send([event]);
  }
}

export function enqueueEvent(event: TrackEvent): void {
  queue.push(event);
}

export function flushNow(): void {
  flush();
}

export function pushToDataLayer(event: TrackEvent): void {
  if (typeof window === 'undefined') return;
  const dl = (window as unknown as Record<string, unknown>).dataLayer as
    | unknown[]
    | undefined;
  if (!dl) return;
  dl.push({
    event: event.event_name,
    quiz_slug: event.quiz_slug,
    session_token: event.session_token,
    step_id: event.step_id,
    step_order: event.step_order,
    ...event.payload,
  });
}

export function startFlushLoop(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });
  }
}

export function stopFlushLoop(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flush();
}
