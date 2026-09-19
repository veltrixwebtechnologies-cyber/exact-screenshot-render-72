// Small per-user rate limiter for the AI-backed server functions.
// Protects the AI budget and blunts abuse of the expensive endpoints.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Allowed calls per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(
      `You have made too many requests. Please wait ${retryAfterSeconds} seconds and try again.`,
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Throws RateLimitError when the caller exceeded the window budget. */
export function enforceRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): void {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
  }

  bucket.count += 1;
}

/** Test/maintenance helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
