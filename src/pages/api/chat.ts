import type { APIRoute } from "astro";
import { createChatReply, sanitizeMessage } from "../../lib/chat/chatService";
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

function sanitizeUid(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }

  const normalized = input.trim();
  if (!normalized || normalized.length > 200) {
    return "";
  }

  return normalized;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Es werden nur JSON-Anfragen akzeptiert." }),
        {
          status: 415,
          headers: JSON_HEADERS,
        }
      );
    }

    const limiterKey = getClientIdentifier(request, clientAddress);
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
    const messageValidation = sanitizeMessage(payload?.message);
    const uid = sanitizeUid(payload?.uid);

    if (!messageValidation.ok) {
      return new Response(
        JSON.stringify({ error: messageValidation.error }),
        {
          status: 400,
          headers: JSON_HEADERS,
        }
      );
    }

    if (!uid) {
      return new Response(
        JSON.stringify({ error: "UID fehlt oder ist ungültig." }),
        {
          status: 400,
          headers: JSON_HEADERS,
        }
      );
    }

    const channel =
      payload?.channel === "instagram" || payload?.channel === "whatsapp"
        ? payload.channel
        : "whatsapp";
    const result = await createChatReply({
      message: messageValidation.value,
      channel,
      uid,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error && error.message
            ? error.message
            : "Die Anfrage konnte serverseitig nicht verarbeitet werden.",
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
};

export const ALL: APIRoute = async () =>
  new Response(JSON.stringify({ error: "Methode nicht erlaubt." }), {
    status: 405,
    headers: JSON_HEADERS,
  });
