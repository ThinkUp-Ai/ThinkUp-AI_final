import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  getUserId,
  markConversationActive,
  shouldStartNewConversation,
} from "../../lib/chat/sessionId";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type DemoChannel = "whatsapp" | "instagram";

type PremiumChatDemoProps = {
  channel?: DemoChannel;
  badge?: string;
  title?: ReactNode;
  description?: string;
  assistantName?: string;
  assistantTagline?: string;
  inputPlaceholder?: string;
  className?: string;
};

const CHANNEL_COPY: Record<
  DemoChannel,
  {
    badge: string;
    title: ReactNode;
    description: string;
    assistantName: string;
    assistantTagline: string;
    inputPlaceholder: string;
    welcome: string;
    hint: string;
  }
> = {
  whatsapp: {
    badge: "Ihr KI-Agent",
    title: (
      <>
        Bucht Termine. Antwortet sofort.{" "}
        <span className="text-[#58FFE9]">Entlastet Ihr Team.</span>
      </>
    ),
    description:
      "Ihr KI-Agent beantwortet Anfragen automatisch, prüft Verfügbarkeiten und hilft dabei, Termine direkt einzubuchen – über WhatsApp, Instagram, Website oder Telefon.",
    assistantName: "Ihr Unternehmen",
    assistantTagline: "Automatische Antworten und Terminbuchung",
    inputPlaceholder: "Nachricht eingeben...",
    welcome:
      "Willkommen bei ThinkUp AI. Testen Sie, wie Ihr KI-Agent Anfragen beantwortet und Termine automatisch vorbereitet.",
    hint:
      "Beispiel: Ich möchte morgen einen Termin buchen. Haben Sie um 10 Uhr noch etwas frei?",
  },
  instagram: {
    badge: "Ihr Instagram Agent",
    title: "Antwortet auf DMs. Qualifiziert Leads. Spart Zeit.",
    description:
      "Ihr Instagram-Agent beantwortet Direktnachrichten automatisch und führt Interessenten schneller zur Anfrage oder Buchung.",
    assistantName: "Ihr Unternehmen",
    assistantTagline: "Automatische Antworten für Instagram DMs",
    inputPlaceholder: "Instagram-DM eingeben...",
    welcome:
      "Willkommen bei ThinkUp AI für Instagram. Testen Sie, wie Ihr Agent Direktnachrichten beantwortet und Interessenten zur Buchung weiterleitet.",
    hint:
      "Beispiel: Hi, was kostet ein Termin und habt ihr diese Woche noch etwas frei?",
  },
};

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-[fadeIn_220ms_ease-out]">
      <div className="inline-flex items-center gap-2 rounded-[24px] rounded-bl-md border border-[#58FFE9]/15 bg-white/6 px-4 py-3 text-sm text-white/70 shadow-tuai">
        <span className="text-white/60">ThinkUp AI schreibt</span>
        <span className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#58FFE9] [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#58FFE9] [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#58FFE9]" />
        </span>
      </div>
    </div>
  );
}

function renderFormattedText(text: string) {
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const parts: ReactNode[] = [];
    const pattern = /(\*[^*\n]+\*|_[^_\n]+_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const token = match[0];

      if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <strong key={`${lineIndex}-${match.index}`} className="font-semibold">
            {token.slice(1, -1)}
          </strong>
        );
      } else if (token.startsWith("_") && token.endsWith("_")) {
        parts.push(
          <span key={`${lineIndex}-${match.index}`} className="italic">
            {token.slice(1, -1)}
          </span>
        );
      } else {
        parts.push(token);
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <Fragment key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
}

export default function PremiumChatDemo({
  channel = "whatsapp",
  badge,
  title,
  description,
  assistantName,
  assistantTagline,
  inputPlaceholder,
  className = "",
}: PremiumChatDemoProps) {
  const copy = CHANNEL_COPY[channel];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: copy.welcome,
    },
    {
      id: "hint",
      role: "assistant",
      text: copy.hint,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const uid = getUserId();
      const hasVisibleConversation = messages.some(
        (message) => message.role === "user"
      );
      const newConversation =
        !hasVisibleConversation || shouldStartNewConversation(trimmed);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          channel,
          uid,
          new_conversation: newConversation,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Die Nachricht konnte gerade nicht verarbeitet werden."
        );
      }

      const replyText =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : typeof data?.answer === "string" && data.answer.trim()
          ? data.answer.trim()
          : typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : typeof data?.text === "string" && data.text.trim()
          ? data.text.trim()
          : "Keine gültige Antwort erhalten.";

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: replyText,
        },
      ]);
      markConversationActive();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Es ist ein unerwarteter Fehler aufgetreten."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <section
      className={`relative overflow-hidden bg-black px-6 py-24 text-white ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#58FFE9]/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-20 h-[420px] w-[420px] rounded-full bg-[#58FFE9]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="pt-8 md:pt-0">
            <span className="inline-flex rounded-full border border-[#58FFE9]/35 bg-[#58FFE9]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#58FFE9]">
              {badge ?? copy.badge}
            </span>

            <h2 className="mt-6 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
              {title ?? copy.title}
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 md:text-lg">
              {description ?? copy.description}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-bold text-white">Mehr Buchungen</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Anfragen werden sofort beantwortet, damit weniger Interessenten
                  abspringen und mehr Termine zustande kommen.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-bold text-white">Weniger Unterbrechungen</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Ihr Team muss nicht jede Nachricht selbst beantworten und kann
                  sich stärker auf Kunden und Termine konzentrieren.
                </p>
              </div>
            </div>

            <div className="mt-7 flex justify-start">
              <a
                href="/buchen"
                className="inline-flex items-center justify-center rounded-full bg-[#58FFE9] px-7 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(88,255,233,0.6)]"
              >
                Produkt anfragen
              </a>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="relative mx-auto flex h-[680px] max-h-[78vh] w-full max-w-[min(100%,420px)] flex-col overflow-hidden rounded-[28px] border border-[#58FFE9]/15 bg-[#05080a] shadow-tuai-strong sm:h-[720px] sm:rounded-[36px]">
              <div className="relative border-b border-[#58FFE9]/8 bg-[linear-gradient(180deg,rgba(9,15,18,0.98),rgba(6,10,12,0.94))] px-4 py-4 sm:px-5">
                <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#58FFE9]/25 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#58FFE9]/18 bg-[#58FFE9]/8">
                    <img
                      src="/logo.png"
                      alt="ThinkUp-AI Logo"
                      className="h-full w-full rounded-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {assistantName ?? copy.assistantName}
                    </p>
                    <p className="text-xs text-[#58FFE9]/80">
                      {assistantTagline ?? copy.assistantTagline}
                    </p>
                  </div>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),radial-gradient(circle_at_top,rgba(88,255,233,0.06),transparent_36%)] px-3 py-4 sm:px-4 sm:py-5"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex animate-[fadeIn_220ms_ease-out] ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[84%] rounded-[22px] px-3 py-3 text-sm leading-6 shadow-tuai sm:rounded-[24px] sm:px-4 ${
                        message.role === "user"
                          ? "rounded-br-md bg-[#58FFE9] text-black"
                          : "rounded-bl-md border border-[#58FFE9]/10 bg-white/6 text-white"
                      }`}
                    >
                      {renderFormattedText(message.text)}
                    </div>
                  </div>
                ))}

                {isSending && <TypingIndicator />}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-white/10 bg-black/80 p-3 backdrop-blur-xl sm:p-4"
              >
                {error && (
                  <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-[24px] border border-[#58FFE9]/15 bg-white/5 p-2 shadow-tuai sm:gap-3 sm:rounded-[28px]">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxLength={1000}
                    disabled={isSending}
                    placeholder={inputPlaceholder ?? copy.inputPlaceholder}
                    className="min-w-0 max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2.5 py-3 text-[16px] text-white placeholder:text-sm placeholder:text-white/35 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[52px] sm:px-3 sm:placeholder:text-base"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#58FFE9] text-black transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(88,255,233,0.6)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:h-12 sm:w-12"
                    aria-label="Nachricht senden"
                  >
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
                        d="M4 12L20 4L13 20L10 14L4 12Z"
                      />
                    </svg>
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-white/40">
                  Demo-Ansicht für Ihren späteren Agenten. Entscheidend ist das
                  Ergebnis: schnellere Antworten und automatisch vorbereitete Termine.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
