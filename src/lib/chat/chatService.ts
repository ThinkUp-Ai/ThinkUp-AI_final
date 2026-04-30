export type ChatRequest = {
  message: string;
  channel?: "whatsapp" | "instagram";
  sessionId: string;
};

export type ChatServiceResult = {
  reply: string;
  provider: "n8n";
  integrationReady: boolean;
};

const MAX_MESSAGE_LENGTH = 1000;

function stripDangerousContent(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeMessage(input: unknown) {
  if (typeof input !== "string") {
    return { ok: false as const, error: "Bitte senden Sie eine Textnachricht." };
  }

  const normalized = stripDangerousContent(input);

  if (!normalized) {
    return { ok: false as const, error: "Die Nachricht darf nicht leer sein." };
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false as const,
      error: `Die Nachricht darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.`,
    };
  }

  return { ok: true as const, value: normalized };
}

function getWebhookUrl(channel: "whatsapp" | "instagram") {
  return channel === "instagram"
    ? import.meta.env.N8N_INSTAGRAM_WEBHOOK_URL?.trim()
    : import.meta.env.N8N_WHATSAPP_WEBHOOK_URL?.trim();
}

function parseWebhookResponse(rawText: string) {
  if (!rawText.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function readReplyText(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedReply = readReplyText(item);
      if (nestedReply) {
        return nestedReply;
      }
    }
    return "";
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const directFields = [
    record.answer,
    record.reply,
    record.message,
    record.text,
    record.response,
    record.output,
    record.content,
  ];

  for (const field of directFields) {
    if (typeof field === "string" && field.trim()) {
      return field.trim();
    }
  }

  const nestedFields = [
    record.data,
    record.body,
    record.result,
    record.payload,
    record.output,
    record.response,
  ];

  for (const field of nestedFields) {
    const nestedReply = readReplyText(field);
    if (nestedReply) {
      return nestedReply;
    }
  }

  return "";
}

async function forwardToN8n(
  message: string,
  channel: "whatsapp" | "instagram",
  sessionId: string
) {
  const webhookUrl = getWebhookUrl(channel);
  if (!webhookUrl) {
    throw new Error(
      channel === "instagram"
        ? "N8N_INSTAGRAM_WEBHOOK_URL fehlt auf dem Server."
        : "N8N_WHATSAPP_WEBHOOK_URL fehlt auf dem Server."
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const webhookSecret = import.meta.env.N8N_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    headers["x-thinkup-webhook-secret"] = webhookSecret;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "website",
      channel,
      message,
      sessionId,
      submittedAt: new Date().toISOString(),
    }),
  });

  const rawText = await response.text().catch(() => "");
  const data = parseWebhookResponse(rawText);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : typeof data === "string" && data.trim()
        ? data.trim()
        : "Der n8n-Webhook konnte die Anfrage nicht verarbeiten."
    );
  }

  const reply = readReplyText(data);
  if (!reply) {
    throw new Error(
      "Der n8n-Webhook hat keine gültige Antwort geliefert. Erwartet wird z. B. answer, reply, message oder text."
    );
  }

  return reply;
}

export async function createChatReply(
  request: ChatRequest
): Promise<ChatServiceResult> {
  const channel = request.channel === "instagram" ? "instagram" : "whatsapp";
  const reply = await forwardToN8n(request.message, channel, request.sessionId);

  return {
    reply,
    provider: "n8n",
    integrationReady: true,
  };
}
