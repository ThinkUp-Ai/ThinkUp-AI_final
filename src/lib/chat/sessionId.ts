const UID_KEY = "thinkupai_uid";

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
