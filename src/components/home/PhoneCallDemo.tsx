import { useState } from "react";

function sanitizePhoneNumber(input: string) {
  return input.replace(/[^\d+]/g, "").slice(0, 18);
}

export default function PhoneCallDemo() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleCall(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sanitizedNumber = sanitizePhoneNumber(phoneNumber.trim());
    if (!sanitizedNumber) {
      setError("Bitte geben Sie zuerst eine gültige Testnummer ein.");
      setStatus("");
      return;
    }

    setIsCalling(true);
    setError("");
    setStatus("Anruf wird gestartet...");

    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: sanitizedNumber }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Der Anruf konnte nicht vorbereitet werden."
        );
      }

      setStatus(
        typeof data?.status === "string"
          ? data.status
          : "Der Anruf wird jetzt gestartet."
      );

      if (typeof window !== "undefined") {
        window.location.href = `tel:${sanitizedNumber}`;
      }
    } catch (callError) {
      setError(
        callError instanceof Error
          ? callError.message
          : "Es ist ein unerwarteter Fehler aufgetreten."
      );
      setStatus("");
    } finally {
      setIsCalling(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-black px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,255,233,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(88,255,233,0.1),_transparent_26%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Telefon Agent
          </span>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Nimmt Anrufe an. Bucht Termine. Entlastet Ihr Team.
          </h2>
          <p className="text-base leading-7 text-white/70 sm:text-lg">
            Ihr Telefon-Agent nimmt Anrufe entgegen, beantwortet häufige Fragen
            und hilft dabei, Termine direkt einzubuchen, ohne dass Ihr Team jeden
            Anruf selbst annehmen muss.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-sm font-semibold text-cyan-200">Mehr Erreichbarkeit</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Auch wenn Ihr Team gerade beschäftigt ist, gehen weniger Anrufe
                verloren und mehr Anfragen werden direkt aufgenommen.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-sm font-semibold text-cyan-200">Weniger Unterbrechungen</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Ihr Team kann weiterarbeiten, während der Agent Anrufe annimmt,
                Fragen beantwortet und Termine vorbereitet.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="absolute inset-4 rounded-[36px] bg-cyan-400/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[#05080a] px-6 py-8 shadow-tuai-strong">
              <div className="mx-auto mb-8 h-1.5 w-24 rounded-full bg-white/10" />
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-tuai">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    className="h-10 w-10"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5.5A2.5 2.5 0 015.5 3H8a2 2 0 011.94 1.515l.64 2.563a2 2 0 01-.54 1.915l-1.2 1.2a14.49 14.49 0 005.017 5.017l1.2-1.2a2 2 0 011.915-.54l2.563.64A2 2 0 0121 16v2.5A2.5 2.5 0 0118.5 21h-1C9.492 21 3 14.508 3 6.5v-1Z"
                    />
                  </svg>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-white">
                  Ihr Telefon Agent
                </h3>
                <p className="mt-2 text-sm text-cyan-200/80">
                  Nimmt Anrufe an und bereitet Termine vor
                </p>
              </div>

              <form onSubmit={handleCall} className="space-y-4">
                <label className="block text-sm font-medium text-white/80">
                  Testnummer
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+49 15xx xxxxx"
                  disabled={isCalling}
                  className="w-full rounded-2xl border border-cyan-300/15 bg-white/5 px-4 py-4 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-70"
                />

                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                {status && !error && (
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
                    {status}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCalling}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-cyan-300 text-lg font-semibold text-black transition duration-200 hover:scale-[1.01] hover:shadow-tuai-strong disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 5.5A2.5 2.5 0 016.5 3H8a2 2 0 011.94 1.515l.64 2.563a2 2 0 01-.54 1.915l-1.2 1.2a14.49 14.49 0 005.017 5.017l1.2-1.2a2 2 0 011.915-.54l2.563.64A2 2 0 0121 16v2.5A2.5 2.5 0 0118.5 21h-1C9.492 21 3 14.508 3 6.5v-1Z"
                      />
                    </svg>
                  </span>
                  {isCalling ? "Verbindung..." : "Anrufen"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-white/40">
                Demo-Ansicht für Ihren späteren Telefon-Agenten. Entscheidend ist
                das Ergebnis: weniger verpasste Anrufe und mehr eingetragene Termine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
