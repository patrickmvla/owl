import type { Context, Next } from "hono";

/**
 * Rate limit placeholder.
 *
 * Returns correct X-RateLimit-* headers for API contract compliance
 * but does not enforce limits. In-memory limiting is broken on Vercel
 * serverless (each instance gets its own counter).
 *
 * Real implementation options (when we have users):
 * - Cloudflare WAF rate limiting rule (zero code, 1 free rule)
 * - Upstash Redis @upstash/ratelimit (10K commands/day free)
 *
 * See ADR-008 for the decision to defer.
 */

const LIMIT = 100;
const WINDOW_S = 60;

export async function rateLimitMiddleware(c: Context, next: Next) {
  const resetAt = Math.floor(Date.now() / 1000) + WINDOW_S;

  c.header("X-RateLimit-Limit", LIMIT.toString());
  c.header("X-RateLimit-Remaining", (LIMIT - 1).toString());
  c.header("X-RateLimit-Reset", resetAt.toString());

  await next();
}
