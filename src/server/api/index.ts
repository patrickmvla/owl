import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { auth } from "@/features/auth/config/auth-server";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { auditLogMiddleware } from "./middleware/audit-log";
import { idempotencyMiddleware } from "./middleware/idempotency";

const app = new Hono().basePath("/api");

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Better Auth handler — handles all /api/auth/* routes
app.on(["POST", "GET"], "/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// API v0 middleware stack
app.use("/v0/*", rateLimitMiddleware);
app.use("/v0/*", idempotencyMiddleware);
app.use("/v0/*", auditLogMiddleware);

// Health endpoints
app.get("/v0/health/public", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

app.get("/v0/health", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    status: "ok",
    timestamp: Date.now(),
    services: {
      database: "connected",
      auth: "operational",
    },
  });
});

export default app;
export type AppType = typeof app;
