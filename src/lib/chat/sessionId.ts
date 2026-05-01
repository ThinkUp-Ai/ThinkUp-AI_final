const SESSION_KEY = "sessionData";
const SESSION_DURATION = 60 * 60 * 1000;
export const NEW_USER_SESSION_ID = "NEW USER";

type StoredSession = {
  id: string;
  createdAt: number;
};

export function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const stored = window.localStorage.getItem(SESSION_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<StoredSession>;

      if (
        typeof parsed.id === "string" &&
        parsed.id &&
        typeof parsed.createdAt === "number" &&
        Date.now() - parsed.createdAt < SESSION_DURATION
      ) {
        return parsed.id;
      }
    } catch {
      // Ignore invalid storage content and start a fresh n8n-owned session below.
    }
  }

  window.localStorage.removeItem(SESSION_KEY);
  return NEW_USER_SESSION_ID;
}

export function saveSessionId(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = sessionId.trim();
  if (!normalized || normalized === NEW_USER_SESSION_ID) {
    return;
  }

  const newSession: StoredSession = {
    id: normalized,
    createdAt: Date.now(),
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
}
