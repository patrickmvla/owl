import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { auth } from "@/features/auth/config/auth-server";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { auditLogMiddleware } from "./middleware/audit-log";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { marketRoutes } from "@/features/market/api/market-routes";
import { portfolioRoutes } from "@/features/portfolio/api/portfolio-routes";

const app = new OpenAPIHono().basePath("/api");

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

// Feature routes
app.route("/v0/market", marketRoutes);
app.route("/v0/portfolio", portfolioRoutes);

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

// OpenAPI spec
app.doc("/v0/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Owl API",
    version: "0.1.0",
    description: "Real-time market intelligence across traditional and crypto markets",
  },
});

// Scalar API docs UI
app.get(
  "/v0/docs",
  Scalar({
    url: "/api/v0/openapi.json",
    theme: "deepSpace",
  }),
);

export default app;
export type AppType = typeof app;
