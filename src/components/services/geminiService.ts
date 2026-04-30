// src/components/services/geminiService.ts
import { getSessionId } from "../../lib/chat/sessionId";

type StreamChunk = { text: string };

function streamFromText(text: string): AsyncIterable<StreamChunk> {
  return (async function* () {
    yield { text };
  })();
}

export function getChatSession() {
  return {
    async sendMessageStream({ message }: { message: string }) {
      try {
        const sessionId = getSessionId();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, sessionId }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errorMessage =
            data?.error || "Beim Abrufen der Antwort ist ein Fehler aufgetreten.";
          return streamFromText(`⚠️ ${errorMessage}`);
        }

        const text =
          typeof data?.reply === "string" && data.reply.trim()
            ? data.reply
            : typeof data?.answer === "string" && data.answer.trim()
            ? data.answer
            : typeof data?.message === "string" && data.message.trim()
            ? data.message
            : typeof data?.text === "string" && data.text.trim()
            ? data.text
            : "Keine gültige Antwort erhalten.";

        return streamFromText(text);
      } catch (err: any) {
        return streamFromText(
          `⚠️ Netzwerk oder Serverfehler: ${err?.message || String(err)}`
        );
      }
    },
  };
}
