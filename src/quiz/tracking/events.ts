export const QUIZ_EVENTS = {
  QUIZ_VISIT: 'quiz_visit',
  QUIZ_START: 'quiz_start',
  STEP_VIEW: 'step_view',
  STEP_ADVANCE: 'step_advance',
  STEP_BACK: 'step_back',
  QUIZ_RESUME: 'quiz_resume',
  QUIZ_COMPLETE_CTA_CLICK: 'quiz_complete_cta_click',
} as const;

export type QuizEventName = (typeof QUIZ_EVENTS)[keyof typeof QUIZ_EVENTS];

export interface TrackEvent {
  event_name: QuizEventName;
  quiz_slug: string;
  session_token: string;
  step_id?: string;
  step_order?: number;
  payload?: Record<string, unknown>;
  utm_source?: string;
  origin?: string;
  idempotency_key?: string;
}
