import type { Context, Next } from "hono";
import { db } from "@/server/db";
import { auditLog } from "@/server/db/schema";

function hashIp(ip: string): string {
  // Simple non-reversible hash — not crypto-grade, just for privacy
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

export async function auditLogMiddleware(c: Context, next: Next) {
  await next();

  // Fire and forget — don't block the response
  const ip = getClientIp(c);

  db.insert(auditLog)
    .values({
      userId: c.get("userId") ?? null,
      action: `${c.req.method.toLowerCase()}.${c.req.path}`,
      resource: c.req.path,
      method: c.req.method,
      statusCode: c.res.status,
      ipHash: hashIp(ip),
    })
    .catch(() => {
      // Silent fail — audit logging should never break the request
    });
}
