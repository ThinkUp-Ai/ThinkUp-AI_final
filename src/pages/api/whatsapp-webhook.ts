import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  GEMINI_MODEL,
  SYSTEM_PROMPT,
  KNOWLEDGE_BASE,
} from "../../components/chatbot/constants";
import { sendWhatsAppText } from "../../lib/metaWhatsApp";
import {
  appendWaMessage,
  isWaMessageProcessed,
  markWaMessageProcessed,
} from "../../lib/whatsappStore";

function normalizeNumberDigits(input: string): string {
  return input.replace(/[^\d]/g, "");
}

function getHeaderSignature(req: Request): string | null {
  const sig = req.headers.get("x-hub-signature-256");
  return sig;
}

function verifyMetaSignature(rawBody: string, req: Request): boolean {
  const appSecret = import.meta.env.META_WA_APP_SECRET;
  if (!appSecret) {
    // If you didn't configure app secret, we can't verify signatures.
    // Better to fail closed.
    return false;
  }

  const sigHeader = getHeaderSignature(req);
  if (!sigHeader) return false;

  // format: sha256=HEX
  const parts = sigHeader.split("=");
  if (parts.length !== 2) return false;
  const provided = parts[1];

  const digest = createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = import.meta.env.META_WA_VERIFY_TOKEN;
  if (!expected) {
    return new Response("Server misconfigured.", { status: 500 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
};

export const POST: APIRoute = async ({ request }) => {
  // Read raw body for signature verification
  const rawBuffer = Buffer.from(await request.arrayBuffer());
  const rawBody = rawBuffer.toString("utf-8");

  // Security: verify webhook signature (fail closed)
  const ok = verifyMetaSignature(rawBody, request);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid signature." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const payload = JSON.parse(rawBody);

  const entries = payload?.entry ?? [];
  const changes = entries?.[0]?.changes ?? [];

  // Handle only incoming messages (ignore statuses)
  const messages =
    changes?.[0]?.value?.messages ??
    // sometimes changes can contain multiple objects
    changes?.flatMap((c: any) => c?.value?.messages ?? []) ??
    [];

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("ok", { status: 200 });
  }

  // We'll generate a response per message text
  for (const msg of messages) {
    const from = msg?.from;
    const messageId = msg?.id;
    const text = msg?.text?.body;
    if (!from || !messageId || typeof text !== "string") continue;

    if (isWaMessageProcessed(messageId)) {
      continue;
    }
    markWaMessageProcessed(messageId);

    const fromDigits = normalizeNumberDigits(from);
    appendWaMessage(fromDigits, {
      id: messageId,
      role: "user",
      text,
    });

    // Generate agent response
    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback =
        "Serverkonfiguration fehlt (GEMINI_API_KEY). Bitte später erneut versuchen.";
      await sendWhatsAppText(fromDigits, fallback);
      appendWaMessage(fromDigits, {
        id: `${messageId}-reply`,
        role: "model",
        text: fallback,
      });
      continue;
    }

    const prompt = `Nutze die WISSENSBASIS, falls relevant. Kanal: whatsapp. Frage:\n${text}`;

    const system = `${SYSTEM_PROMPT}\n\n---\nWISSENSBASIS:\n${KNOWLEDGE_BASE}\n---`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json().catch(() => null);
    const replyText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text ?? "")
        .join("") || "Leider kam keine Antwort zurück.";

    await sendWhatsAppText(fromDigits, replyText);
    appendWaMessage(fromDigits, {
      id: `${messageId}-reply`,
      role: "model",
      text: replyText,
    });
  }

  return new Response("ok", { status: 200 });
};

