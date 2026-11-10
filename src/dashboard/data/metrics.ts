import { supabase } from '@/shared/supabase/client';

const METRICS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/metrics`;

async function fetchMetrics<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const url = new URL(`${METRICS_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export interface OverviewTotals {
  visits: number;
  starts: number;
  final_clicks: number;
  interactionRate: number;
  completionRate: number;
}

export interface OverviewDaily {
  date_bucket: string;
  utm_source: string;
  visits: number;
  starts: number;
  final_clicks: number;
}

export interface OverviewResponse {
  period: { from: string; to: string };
  totals: OverviewTotals;
  daily: OverviewDaily[];
  trafficQuality?: { human: number; suspect: number; bot: number };
  comparison?: {
    period: { from: string; to: string };
    totals: OverviewTotals;
  };
}

export interface FunnelStep {
  step_id: string;
  step_order: number;
  reached: number;
  advanced: number;
  back: number;
  final_clicks: number;
  cumulative_rate: number;
  step_rate: number;
  drop_rate: number;
}

export interface FunnelResponse {
  period: { from: string; to: string };
  funnel: FunnelStep[];
}

export interface OriginRow {
  source: string;
  visits: number;
  starts: number;
  final_clicks: number;
  interactionRate: number;
  completionRate: number;
}

export interface OriginResponse {
  period: { from: string; to: string };
  origins: OriginRow[];
}

export function fetchOverview(params: {
  quiz_slug: string;
  date_from: string;
  date_to: string;
  compare?: boolean;
  utm_source?: string;
}): Promise<OverviewResponse> {
  return fetchMetrics('overview', {
    quiz_slug: params.quiz_slug,
    date_from: params.date_from,
    date_to: params.date_to,
    ...(params.compare ? { compare: 'true' } : {}),
    ...(params.utm_source ? { utm_source: params.utm_source } : {}),
  });
}

export function fetchFunnel(params: {
  quiz_slug: string;
  date_from: string;
  date_to: string;
  utm_source?: string;
}): Promise<FunnelResponse> {
  return fetchMetrics('funnel', {
    quiz_slug: params.quiz_slug,
    date_from: params.date_from,
    date_to: params.date_to,
    ...(params.utm_source ? { utm_source: params.utm_source } : {}),
  });
}

export function fetchOrigin(params: {
  quiz_slug: string;
  date_from: string;
  date_to: string;
}): Promise<OriginResponse> {
  return fetchMetrics('origin', {
    quiz_slug: params.quiz_slug,
    date_from: params.date_from,
    date_to: params.date_to,
  });
}
