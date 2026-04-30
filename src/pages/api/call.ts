import type { APIRoute } from "astro";
import { prepareCallPlaceholder, sanitizePhoneInput } from "../../lib/call/callService";
import { consumeRateLimit } from "../../lib/chat/rateLimiter";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function getClientIdentifier(request: Request, clientAddress: string | undefined) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || clientAddress || "anonymous";
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Es werden nur JSON-Anfragen akzeptiert." }),
        { status: 415, headers: JSON_HEADERS }
      );
    }

    const limiterKey = `${getClientIdentifier(request, clientAddress)}:call`;
    const rateLimit = consumeRateLimit(limiterKey);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Zu viele Anfragen. Bitte versuchen Sie es in einem Moment erneut.",
        }),
        {
          status: 429,
          headers: {
            ...JSON_HEADERS,
            "Retry-After": String(
              Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1)
            ),
          },
        }
      );
    }

    const payload = await request.json().catch(() => null);
    const phoneValidation = sanitizePhoneInput(payload?.phoneNumber);
    if (!phoneValidation.ok) {
      return new Response(JSON.stringify({ error: phoneValidation.error }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const result = await prepareCallPlaceholder(phoneValidation.value);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Der Anruf konnte serverseitig nicht vorbereitet werden." }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

export const ALL: APIRoute = async () =>
  new Response(JSON.stringify({ error: "Methode nicht erlaubt." }), {
    status: 405,
    headers: JSON_HEADERS,
  });
