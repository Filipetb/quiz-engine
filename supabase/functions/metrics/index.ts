import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

async function getQuizId(
  supabase: ReturnType<typeof createClient>,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("quizzes")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();
  return data?.id ?? null;
}

async function refreshAggregates(
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  await supabase.rpc("refresh_quiz_aggregates");
}

// ─────────────────────── /overview ───────────────────────

interface OverviewRow {
  date_bucket: string;
  utm_source: string;
  visits: number;
  starts: number;
  final_clicks: number;
}

async function handleOverview(
  supabase: ReturnType<typeof createClient>,
  quizId: string,
  dateFrom: string,
  dateTo: string,
  compare: boolean,
  utmSource: string | null,
): Promise<Response> {
  await refreshAggregates(supabase);

  let query = supabase
    .from("quiz_overview_daily")
    .select("date_bucket, utm_source, visits, starts, final_clicks")
    .eq("quiz_id", quizId)
    .gte("date_bucket", dateFrom)
    .lte("date_bucket", dateTo);

  if (utmSource) query = query.eq("utm_source", utmSource);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);

  const rows = (data ?? []) as OverviewRow[];
  const totals = rows.reduce(
    (acc, r) => ({
      visits: acc.visits + Number(r.visits),
      starts: acc.starts + Number(r.starts),
      final_clicks: acc.final_clicks + Number(r.final_clicks),
    }),
    { visits: 0, starts: 0, final_clicks: 0 },
  );

  const interactionRate = totals.visits > 0
    ? totals.starts / totals.visits
    : 0;
  const completionRate = totals.starts > 0
    ? totals.final_clicks / totals.starts
    : 0;

  const { data: qualityRows } = await supabase.rpc(
    "get_traffic_quality_breakdown",
    { p_quiz_id: quizId, p_date_from: dateFrom, p_date_to: dateTo },
  );
  const trafficQuality = { human: 0, suspect: 0, bot: 0 };
  for (
    const r of (qualityRows ?? []) as {
      traffic_quality: string;
      session_count: number;
    }[]
  ) {
    const k = r.traffic_quality as keyof typeof trafficQuality;
    if (k in trafficQuality) trafficQuality[k] = Number(r.session_count);
  }

  const result: Record<string, unknown> = {
    period: { from: dateFrom, to: dateTo },
    totals: { ...totals, interactionRate, completionRate },
    daily: rows,
    trafficQuality,
  };

  if (compare) {
    const daysDiff = daysBetween(dateFrom, dateTo) + 1;
    const prevTo = subtractDays(dateFrom, 1);
    const prevFrom = subtractDays(prevTo, daysDiff - 1);

    let prevQuery = supabase
      .from("quiz_overview_daily")
      .select("date_bucket, utm_source, visits, starts, final_clicks")
      .eq("quiz_id", quizId)
      .gte("date_bucket", prevFrom)
      .lte("date_bucket", prevTo);

    if (utmSource) prevQuery = prevQuery.eq("utm_source", utmSource);

    const { data: prevData } = await prevQuery;
    const prevRows = (prevData ?? []) as OverviewRow[];
    const prevTotals = prevRows.reduce(
      (acc, r) => ({
        visits: acc.visits + Number(r.visits),
        starts: acc.starts + Number(r.starts),
        final_clicks: acc.final_clicks + Number(r.final_clicks),
      }),
      { visits: 0, starts: 0, final_clicks: 0 },
    );

    result.comparison = {
      period: { from: prevFrom, to: prevTo },
      totals: {
        ...prevTotals,
        interactionRate: prevTotals.visits > 0
          ? prevTotals.starts / prevTotals.visits
          : 0,
        completionRate: prevTotals.starts > 0
          ? prevTotals.final_clicks / prevTotals.starts
          : 0,
      },
    };
  }

  return jsonResponse(result);
}

// ─────────────────────── /funnel ───────────────────────

interface FunnelRow {
  step_id: string;
  step_order: number;
  utm_source: string;
  unique_sessions_reached: number;
  unique_sessions_advanced: number;
  unique_sessions_back: number;
  unique_final_clicks: number;
}

async function handleFunnel(
  supabase: ReturnType<typeof createClient>,
  quizId: string,
  dateFrom: string,
  dateTo: string,
  utmSource: string | null,
): Promise<Response> {
  await refreshAggregates(supabase);

  let query = supabase
    .from("quiz_step_funnel_daily")
    .select(
      "step_id, step_order, utm_source, unique_sessions_reached, unique_sessions_advanced, unique_sessions_back, unique_final_clicks",
    )
    .eq("quiz_id", quizId)
    .gte("date_bucket", dateFrom)
    .lte("date_bucket", dateTo);

  if (utmSource) query = query.eq("utm_source", utmSource);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);

  const rows = (data ?? []) as FunnelRow[];

  const stepMap = new Map<
    string,
    {
      step_id: string;
      step_order: number;
      reached: number;
      advanced: number;
      back: number;
      final_clicks: number;
    }
  >();

  for (const r of rows) {
    const existing = stepMap.get(r.step_id);
    if (existing) {
      existing.reached += Number(r.unique_sessions_reached);
      existing.advanced += Number(r.unique_sessions_advanced);
      existing.back += Number(r.unique_sessions_back);
      existing.final_clicks += Number(r.unique_final_clicks);
    } else {
      stepMap.set(r.step_id, {
        step_id: r.step_id,
        step_order: r.step_order,
        reached: Number(r.unique_sessions_reached),
        advanced: Number(r.unique_sessions_advanced),
        back: Number(r.unique_sessions_back),
        final_clicks: Number(r.unique_final_clicks),
      });
    }
  }

  const steps = Array.from(stepMap.values()).sort(
    (a, b) => a.step_order - b.step_order,
  );

  // advancedOut: sessões únicas que saíram de cada etapa.
  // Para a última etapa usa final_clicks como proxy de saída pelo CTA.
  const stepsWithAdv = steps.map((s, i) => {
    const isLast = i === steps.length - 1;
    const advancedOut = isLast ? s.final_clicks : steps[i + 1].reached;
    return { ...s, advancedOut };
  });

  // Baseline para Conv.Acum. = quem avançou da etapa 0 (started the quiz).
  const baseAdvanced = stepsWithAdv[0]?.advancedOut ?? 0;

  const funnel = stepsWithAdv.map((s) => ({
    step_id: s.step_id,
    step_order: s.step_order,
    reached: s.reached,
    advanced: s.advancedOut,
    back: s.back,
    final_clicks: s.final_clicks,
    cumulative_rate: baseAdvanced > 0 ? s.advancedOut / baseAdvanced : 0,
    step_rate: s.reached > 0 ? s.advancedOut / s.reached : 0,
    drop_rate: baseAdvanced > 0 ? 1 - s.advancedOut / baseAdvanced : 0,
  }));

  return jsonResponse({ period: { from: dateFrom, to: dateTo }, funnel });
}

// ─────────────────────── /origin ───────────────────────

async function handleOrigin(
  supabase: ReturnType<typeof createClient>,
  quizId: string,
  dateFrom: string,
  dateTo: string,
): Promise<Response> {
  await refreshAggregates(supabase);

  const { data, error } = await supabase
    .from("quiz_overview_daily")
    .select("utm_source, visits, starts, final_clicks")
    .eq("quiz_id", quizId)
    .gte("date_bucket", dateFrom)
    .lte("date_bucket", dateTo);

  if (error) return errorResponse(error.message, 500);

  const rows = (data ?? []) as OverviewRow[];

  const sourceMap = new Map<
    string,
    { visits: number; starts: number; final_clicks: number }
  >();

  for (const r of rows) {
    const src = r.utm_source || "direct";
    const existing = sourceMap.get(src);
    if (existing) {
      existing.visits += Number(r.visits);
      existing.starts += Number(r.starts);
      existing.final_clicks += Number(r.final_clicks);
    } else {
      sourceMap.set(src, {
        visits: Number(r.visits),
        starts: Number(r.starts),
        final_clicks: Number(r.final_clicks),
      });
    }
  }

  const origins = Array.from(sourceMap.entries())
    .map(([source, metrics]) => ({
      source,
      ...metrics,
      interactionRate: metrics.visits > 0
        ? metrics.starts / metrics.visits
        : 0,
      completionRate: metrics.starts > 0
        ? metrics.final_clicks / metrics.starts
        : 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  return jsonResponse({
    period: { from: dateFrom, to: dateTo },
    origins,
  });
}

// ─────────────────────── Helpers ───────────────────────

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}

// ─────────────────────── Router ───────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401);
  }

  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const pathname = url.pathname;

  const segments = pathname.split("/").filter(Boolean);
  const endpoint = segments[segments.length - 1];

  const quizSlug = url.searchParams.get("quiz_slug");
  if (!quizSlug) return errorResponse("quiz_slug is required");

  const quizId = await getQuizId(supabase, quizSlug);
  if (!quizId) return errorResponse(`Quiz not found: ${quizSlug}`, 404);

  const today = todaySP();
  const dateFrom = parseDate(url.searchParams.get("date_from")) ?? today;
  const dateTo = parseDate(url.searchParams.get("date_to")) ?? today;
  const compare = url.searchParams.get("compare") === "true";
  const utmSource = url.searchParams.get("utm_source") || null;

  switch (endpoint) {
    case "overview":
      return handleOverview(
        supabase,
        quizId,
        dateFrom,
        dateTo,
        compare,
        utmSource,
      );
    case "funnel":
      return handleFunnel(supabase, quizId, dateFrom, dateTo, utmSource);
    case "origin":
      return handleOrigin(supabase, quizId, dateFrom, dateTo);
    default:
      return errorResponse(
        `Unknown endpoint: ${endpoint}. Use overview, funnel, or origin.`,
        404,
      );
  }
});
