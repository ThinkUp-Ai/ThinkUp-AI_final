import type { APIRoute } from "astro";

const WEBHOOK_URL =
  import.meta.env.N8N_WEBHOOK_URL_w2n_Gesichter_der_Stadt ??
  import.meta.env.N8N_WEBHOOK_URL_w2n_Gescihter_der_Stadt;

const ALLOWED_ORIGINS = [
  "https://wave2network.com",
  "https://www.wave2network.com",
  "https://thinkupai.de",
  "https://www.thinkupai.de",
];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function corsHeaders(origin: string) {
  return {
    ...JSON_HEADERS,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin") ?? "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "Nicht erlaubt." }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Zu viele Anfragen. Bitte warte kurz." }),
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const message = body?.message;
    const sessionId = body?.sessionId;

    if (!message || typeof message !== "string" || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Ungültige Nachricht." }),
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(
        JSON.stringify({ error: "Session fehlt." }),
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL is not set");
      return new Response(
        JSON.stringify({ error: "Serverkonfiguration fehlt." }),
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId, source: "website" }),
    });

    const data = await res.json().catch(() => null);
    const d = Array.isArray(data) ? data[0] : data;
    const reply =
    d?.reply ||
    d?.answer ||
    d?.text ||
    d?.message ||
    "Keine Antwort erhalten.";

    return new Response(
      JSON.stringify({ reply, provider: "n8n", integrationReady: true }),
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (e) {
    console.error("chatw2n error:", e);
    return new Response(
      JSON.stringify({ error: "Serverfehler." }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

export const ALL: APIRoute = async () =>
  new Response(JSON.stringify({ error: "Nur POST erlaubt." }), {
    status: 405,
    headers: JSON_HEADERS,
  });
