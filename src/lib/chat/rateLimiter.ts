type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 12;

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRateLimitConfig() {
  return {
    windowMs: readPositiveInt(
      import.meta.env.CHAT_RATE_LIMIT_WINDOW_MS,
      DEFAULT_WINDOW_MS
    ),
    maxRequests: readPositiveInt(
      import.meta.env.CHAT_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_MAX_REQUESTS
    ),
  };
}

export function consumeRateLimit(key: string) {
  const now = Date.now();
  const { windowMs, maxRequests } = getRateLimitConfig();
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(maxRequests - 1, 0),
      resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  RATE_LIMIT_STORE.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(maxRequests - existing.count, 0),
    resetAt: existing.resetAt,
  };
}
