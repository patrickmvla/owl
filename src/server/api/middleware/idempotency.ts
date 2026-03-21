import type { Context, Next } from "hono";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Idempotency placeholder.
 *
 * Validates the Idempotency-Key format (UUID v4) on write requests.
 * Does not enforce idempotency — correct enforcement requires
 * per-route database transactions (Stripe's model), not middleware.
 *
 * Real implementation (Stage 4, when write endpoints exist):
 * - Add `idempotency_key` table to schema
 * - Per-route: INSERT ... ON CONFLICT inside a transaction
 * - pg_cron cleanup for 24h expiry
 *
 * This middleware stays as the format validator and fast-path check.
 */
export async function idempotencyMiddleware(c: Context, next: Next) {
  if (c.req.method === "GET" || c.req.method === "HEAD") {
    await next();
    return;
  }

  const key = c.req.header("Idempotency-Key");

  if (key && !UUID_V4_REGEX.test(key)) {
    return c.json(
      {
        type: "https://owl.dev/errors/invalid-idempotency-key",
        title: "Invalid Idempotency-Key",
        status: 400,
        detail: "Idempotency-Key must be a valid UUID v4",
      },
      400,
    );
  }

  await next();
}
