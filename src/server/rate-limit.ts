import "server-only";

import { headers } from "next/headers";

/**
 * A small in-memory rate limiter for the endpoints worth guessing at: admin
 * login, download re-issue, and public uploads.
 *
 * Deliberately in-process. That means it resets on deploy and is per-instance,
 * so on serverless it limits each running instance rather than the fleet — it
 * raises the cost of a brute-force attempt without pretending to be airtight.
 * If this ever needs to be exact, move the same interface onto Redis or
 * MongoDB; nothing calling it would have to change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Stops the map growing without bound on a long-lived server. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * Counts one attempt against `key`. Returns whether it may proceed.
 *
 * The window does not slide: once `limit` is reached, everything is refused
 * until `windowMs` has passed since the first attempt in that window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP.
 *
 * Proxy headers are forgeable in general, so this is a speed bump rather than
 * an identity. On Vercel and most hosts the platform overwrites
 * `x-forwarded-for`, which makes it trustworthy there.
 */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return store.get("x-real-ip") ?? "unknown";
}
