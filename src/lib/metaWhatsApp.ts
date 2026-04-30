function normalizeNumberForMeta(input: string): string {
  // WhatsApp Cloud API expects digits in E.164 without '+'.
  // Example: "+491512345678" -> "491512345678"
  return input.replace(/[^\d]/g, "");
}

export async function sendWhatsAppText(to: string, body: string) {
  const accessToken = import.meta.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = import.meta.env.META_WA_PHONE_NUMBER_ID;

  if (!accessToken) {
    throw new Error("META_WA_ACCESS_TOKEN fehlt (Server-Env).");
  }
  if (!phoneNumberId) {
    throw new Error("META_WA_PHONE_NUMBER_ID fehlt (Server-Env).");
  }

  const normalizedTo = normalizeNumberForMeta(to);
  if (!normalizedTo) {
    throw new Error("Ungültige Empfaenger-Nummer.");
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizedTo,
      type: "text",
      text: { body },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const apiError = data?.error?.message || "Fehler beim WhatsApp Send.";
    throw new Error(apiError);
  }

  // Return something useful for debugging
  return data as { messages?: unknown };
}

