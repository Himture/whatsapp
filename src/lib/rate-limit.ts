// In-memory token bucket rate limiter. Process-local — survives within a warm
// serverless function but resets on cold start. Acceptable for the webhook
// path (Meta retries) and as a first-line defense; swap for Upstash if
// stricter cross-region limits are needed (interface stays the same).

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface RateLimitOptions {
  capacity: number;
  refillPer: number;
  intervalMs: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(scope: string, key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;
  const existing = buckets.get(bucketKey);

  if (!existing) {
    buckets.set(bucketKey, { tokens: opts.capacity - 1, updatedAt: now });
    return true;
  }

  const elapsed = now - existing.updatedAt;
  const refillCount = Math.floor((elapsed / opts.intervalMs) * opts.refillPer);
  const refilled = Math.min(opts.capacity, existing.tokens + refillCount);

  if (refilled <= 0) {
    return false;
  }

  existing.tokens = refilled - 1;
  // Advance the clock only by the time represented by the whole tokens we
  // actually credited, carrying the sub-token remainder forward. Resetting to
  // `now` on every call would discard sub-interval elapsed time and under-refill
  // the bucket under sustained load. When the bucket is full there's no
  // fractional debt to carry, so snap to `now`.
  if (refilled >= opts.capacity) {
    existing.updatedAt = now;
  } else if (refillCount > 0) {
    existing.updatedAt += (refillCount / opts.refillPer) * opts.intervalMs;
  }
  return true;
}
