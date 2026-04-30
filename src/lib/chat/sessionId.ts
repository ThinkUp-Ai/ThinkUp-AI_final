const SESSION_KEY = "sessionData";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

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
      // Ignore invalid storage content and create a fresh session below.
    }
  }

  const newSession: StoredSession = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession.id;
}
