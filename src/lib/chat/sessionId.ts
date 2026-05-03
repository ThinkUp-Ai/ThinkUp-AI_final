const UID_KEY = "thinkupai_uid";
const LAST_MESSAGE_AT_KEY = "thinkupai_last_message_at";
const NEW_CONVERSATION_AFTER_MS = 30 * 60 * 1000;
const NEW_CONVERSATION_PHRASES = [
  "neue konversation",
  "neue unterhaltung",
  "neues gespräch",
  "neuen chat",
  "neu starten",
  "von vorne",
];

export function getUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  const stored = window.localStorage.getItem(UID_KEY)?.trim();
  if (stored) {
    return stored;
  }

  const uid = crypto.randomUUID();
  window.localStorage.setItem(UID_KEY, uid);
  return uid;
}

export function shouldStartNewConversation(message: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const normalizedMessage = message.toLowerCase().trim();
  if (NEW_CONVERSATION_PHRASES.some((phrase) => normalizedMessage.includes(phrase))) {
    return true;
  }

  const lastMessageAt = Number(window.localStorage.getItem(LAST_MESSAGE_AT_KEY));
  if (!Number.isFinite(lastMessageAt) || lastMessageAt <= 0) {
    return true;
  }

  return Date.now() - lastMessageAt >= NEW_CONVERSATION_AFTER_MS;
}

export function markConversationActive() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_MESSAGE_AT_KEY, String(Date.now()));
}
