export function sanitizePhoneInput(input: unknown) {
  if (typeof input !== "string") {
    return { ok: false as const, error: "Bitte senden Sie eine Telefonnummer." };
  }

  const normalized = input.replace(/[^\d+]/g, "").trim();
  if (!normalized || normalized.length < 7) {
    return { ok: false as const, error: "Bitte geben Sie eine gueltige Telefonnummer ein." };
  }

  if (normalized.length > 18) {
    return { ok: false as const, error: "Die Telefonnummer ist zu lang." };
  }

  return { ok: true as const, value: normalized };
}

export async function prepareCallPlaceholder(_phoneNumber: string) {
  const twilioReady = Boolean(import.meta.env.TWILIO_ACCOUNT_SID);

  // INSERT TWILIO VOICE INTEGRATION HERE:
  // Replace this placeholder with a secure server-side call to your Twilio
  // Voice flow, outbound call trigger, or handoff workflow.
  return {
    status:
      "Call-Demo vorbereitet. Auf mobilen Geraeten wird jetzt der Telefon-Dialog geoeffnet.",
    provider: twilioReady ? "twilio-config-detected" : "placeholder",
    integrationReady: false,
  };
}
