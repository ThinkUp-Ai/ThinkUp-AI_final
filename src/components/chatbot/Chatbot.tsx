// src/components/chatbot/Chatbot.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { UI_COPY } from "./constants";
import type { Message } from "./types";
import { Role } from "./types";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chatbot Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-white">
          <h3 className="font-bold">Fehler im Chatbot</h3>
          <p className="text-sm mt-2">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Chatbot: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Session lazy loading - nur wenn gebraucht
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (isOpen && !session) {
      // Dynamischer Import nur wenn Chat geöffnet wird
      import("../services/geminiService").then((module) => {
        setSession(module.getChatSession());
      }).catch(err => {
        console.error("Gemini Service konnte nicht geladen werden:", err);
      });
    }
  }, [isOpen, session]);

  // Willkommensnachricht
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 0
        ? [{ role: Role.MODEL, text: UI_COPY?.welcome ?? "Hi! Wie kann ich helfen?" }]
        : prev
    );
  }, []);

  // Auto-Scroll
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, isOpen]);

  async function handleSend(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || loading || !session) return;

    const newUserMessage: Message = { role: Role.USER, text: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const responseStream = await session.sendMessageStream({ message: trimmed });
      let responseText = "";

      for await (const chunk of responseStream) {
        responseText += chunk.text;
      }

      if (!responseText) {
        responseText = "Entschuldigung, ich konnte keine Antwort generieren.";
      }

      setMessages((prev) => [
        ...prev,
        { role: Role.MODEL, text: responseText },
      ]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: Role.MODEL,
          text: "Es gab ein Problem bei der Kommunikation mit dem KI-Service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      /* FIX: w-full entfernt und left-5 hinzugefügt. Auf Desktop (sm:) wird max-w-sm gesetzt und left-auto wieder entfernt. */
      className="fixed bottom-5 right-5 z-[99998] left-5 sm:w-full sm:max-w-sm sm:left-auto h-[40rem] max-h-[90vh] rounded-2xl shadow-lg backdrop-blur-md flex flex-col overflow-hidden bg-black/80 border border-white/10 transition-all duration-300 ease-in-out"
      style={{
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(100%) scale(0.5)",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Header bleibt unverändert */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/60">
        <h2 className="text-lg font-semibold text-[#58FFE9]">
          ThinkUp AI-Assistant
        </h2>
        <button
          onClick={onClose}
          aria-label="Chat schließen"
          className="text-white/80 hover:text-[#58FFE9] transition focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Nachrichtenbereich */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <ErrorBoundary>
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role === Role.USER ? "user" : "model"}
              text={m.text}
            />
          ))}
        </ErrorBoundary>
        {loading && (
          <div className="text-white/60 text-sm">Antwort wird generiert…</div>
        )}
      </div>

      {/* Input Bereich */}
      <div className="border-t border-white/10 p-2 bg-black/60"> 
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag mich etwas über KI, Automatisierung oder ThinkUp-AI…"
            rows={2}
            className="flex-1 w-0 resize-none rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#58FFE9]/50 md:text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="h-10 shrink-0 rounded-xl px-3 md:px-4 bg-[#58FFE9] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow flex items-center justify-center"
          >
            {/* Text für Tablet/Desktop */}
            <span className="hidden md:inline">Senden</span>
            {/* Icon für Mobile */}
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-5 h-5 md:hidden"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.874L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          Hinweis: Antworten können KI-generiert sein und Fehler enthalten.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
