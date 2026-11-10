import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
};

const VALID_EVENTS = [
  "quiz_visit",
  "quiz_start",
  "step_view",
  "step_advance",
  "step_back",
  "quiz_resume",
  "quiz_complete_cta_click",
] as const;

const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /pinterest/i,
  /yandexbot/i,
];

function classifyTraffic(
  userAgent: string | null,
): "human" | "suspect" | "bot" {
  if (!userAgent) return "suspect";
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) return "bot";
  }
  return "human";
}

function detectDevice(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

interface TrackPayload {
  event_name: string;
  quiz_slug: string;
  session_token: string;
  step_id?: string;
  step_order?: number;
  payload?: Record<string, unknown>;
  utm_source?: string;
  origin?: string;
  idempotency_key?: string;
}

function validatePayload(body: unknown): {
  ok: true;
  data: TrackPayload;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.event_name !== "string" || !b.event_name) {
    return { ok: false, error: "event_name is required" };
  }
  if (!VALID_EVENTS.includes(b.event_name as typeof VALID_EVENTS[number])) {
    return { ok: false, error: `Invalid event_name: ${b.event_name}` };
  }
  if (typeof b.quiz_slug !== "string" || !b.quiz_slug) {
    return { ok: false, error: "quiz_slug is required" };
  }
  if (typeof b.session_token !== "string" || !b.session_token) {
    return { ok: false, error: "session_token is required" };
  }

  return {
    ok: true,
    data: {
      event_name: b.event_name as string,
      quiz_slug: b.quiz_slug as string,
      session_token: b.session_token as string,
      step_id: typeof b.step_id === "string" ? b.step_id : undefined,
      step_order: typeof b.step_order === "number" ? b.step_order : undefined,
      payload: typeof b.payload === "object" && b.payload !== null
        ? b.payload as Record<string, unknown>
        : undefined,
      utm_source: typeof b.utm_source === "string" ? b.utm_source : undefined,
      origin: typeof b.origin === "string" ? b.origin : undefined,
      idempotency_key: typeof b.idempotency_key === "string"
        ? b.idempotency_key
        : undefined,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Lemos o corpo como texto cru para permitir Content-Type: text/plain no
  // cliente e evitar preflight CORS (simple request). JSON.parse manual aqui.
  let body: unknown;
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const data = validation.data;
  const userAgent = req.headers.get("user-agent");
  const trafficQuality = classifyTraffic(userAgent);
  const deviceType = detectDevice(userAgent);
  const country = req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;

  const utmSource = data.utm_source ?? null;
  const origin = data.origin ?? req.headers.get("referer") ?? null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .select("id")
    .eq("slug", data.quiz_slug)
    .eq("status", "active")
    .single();

  if (quizErr || !quiz) {
    return new Response(
      JSON.stringify({ error: `Quiz not found: ${data.quiz_slug}` }),
      {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const quizId = quiz.id;

  // Upsert com ignoreDuplicates evita race condition quando múltiplos eventos
  // do primeiro load (quiz_visit + step_view) chegam em paralelo. As colunas
  // de origem (utm/device/country) só são gravadas na inserção — no conflict
  // nada é sobreescrito. Campos mutáveis (is_started, current_step_id, etc.)
  // vão no UPDATE condicional abaixo.
  const { error: upsertErr } = await supabase
    .from("quiz_sessions")
    .upsert(
      {
        quiz_id: quizId,
        session_token: data.session_token,
        utm_source: utmSource,
        origin: origin,
        device_type: deviceType,
        country: country,
        traffic_quality: trafficQuality,
        current_step_id: data.step_id ?? null,
      },
      { onConflict: "quiz_id,session_token", ignoreDuplicates: true },
    );

  if (upsertErr) {
    return new Response(
      JSON.stringify({ error: "Failed to upsert session" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const { data: sessionRow, error: selectErr } = await supabase
    .from("quiz_sessions")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("session_token", data.session_token)
    .single();

  if (selectErr || !sessionRow) {
    return new Response(
      JSON.stringify({ error: "Failed to resolve session" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const sessionId = sessionRow.id;

  const updates: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    traffic_quality: trafficQuality,
  };

  if (data.step_id) updates.current_step_id = data.step_id;
  if (data.event_name === "quiz_start") {
    updates.is_started = true;
    updates.started_at = new Date().toISOString();
  }
  if (data.event_name === "quiz_complete_cta_click") {
    updates.is_completed = true;
  }
  if (data.event_name === "quiz_resume") {
    updates.resumed_at = new Date().toISOString();
  }

  await supabase
    .from("quiz_sessions")
    .update(updates)
    .eq("id", sessionId);

  const { error: eventErr } = await supabase
    .from("quiz_events")
    .insert({
      quiz_id: quizId,
      session_id: sessionId,
      event_name: data.event_name,
      step_id: data.step_id ?? null,
      step_order: data.step_order ?? null,
      event_ts: new Date().toISOString(),
      payload: data.payload ?? null,
      utm_source: utmSource,
      origin: origin,
      device_type: deviceType,
      country: country,
      traffic_quality: trafficQuality,
      idempotency_key: data.idempotency_key ?? null,
    });

  if (eventErr) {
    if (
      eventErr.code === "23505" &&
      eventErr.message?.includes("idempotency")
    ) {
      return new Response(JSON.stringify({ status: "duplicate_ignored" }), {
        status: 202,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Failed to insert event" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 202,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
