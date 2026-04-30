import { useEffect, useRef, useState } from "react";

const API_URL = "/api/chatw2n";

type WaveMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function getSessionId() {
  let id = localStorage.getItem("chat_session_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("chat_session_id", id);
  }

  return id;
}

/* *text* → fett */
function formatText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function WaveChat() {
  const [messages, setMessages] = useState<WaveMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hallo 👋\nStell mir deine Frage.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: WaveMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId: getSessionId(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Die Anfrage konnte nicht verarbeitet werden."
        );
      }

      const reply =
        data?.reply ||
        data?.answer ||
        data?.text ||
        data?.message ||
        "Keine Antwort erhalten.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: reply,
        },
      ]);
    } catch (error) {
      console.error("Fetch Fehler:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          text: "Fehler bei der Anfrage.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wave-chat-container">
      <div className="wave-chat-header">
        <h2>Gesichter der Stadt FAQ</h2>
        <p>Stelle deine Fragen</p>
      </div>

      <div ref={containerRef} className="wave-chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent:
                message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              className={
                message.role === "user"
                  ? "wave-msg user"
                  : "wave-msg bot"
              }
              style={{
                display: "inline-block",
                maxWidth: "80%",
                width: "fit-content",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatText(message.text)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="wave-msg bot wave-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      <div className="wave-chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frage eingeben..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage}>Senden</button>
      </div>
    </div>
  );
}