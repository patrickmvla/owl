import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { auth } from "@/features/auth/config/auth-server";
import {
  AlertParamsSchema,
  CreateAlertSchema,
  ToggleAlertSchema,
} from "../schemas/alert-schemas";
import {
  getAlertRules,
  createAlertRule,
  toggleAlertRule,
  deleteAlertRule,
} from "../services/alert-service";

async function getUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user.id ?? null;
}

export const alertRoutes = new OpenAPIHono()

  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["Alerts"],
      summary: "List alert rules",
      responses: { 200: { description: "Alert rules", content: { "application/json": { schema: z.array(z.any()) } } }, 401: { description: "Unauthorized" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      const rules = await getAlertRules(userId);
      return c.json(rules, 200);
    },
  )

  .openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["Alerts"],
      summary: "Create alert rule",
      request: { body: { content: { "application/json": { schema: CreateAlertSchema } } } },
      responses: { 201: { description: "Alert created", content: { "application/json": { schema: z.any() } } }, 401: { description: "Unauthorized" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      const body = c.req.valid("json");
      const result = await createAlertRule(userId, body);
      return c.json(result, 201);
    },
  )

  .openapi(
    createRoute({
      method: "patch",
      path: "/{id}",
      tags: ["Alerts"],
      summary: "Toggle alert rule",
      request: { params: AlertParamsSchema, body: { content: { "application/json": { schema: ToggleAlertSchema } } } },
      responses: { 200: { description: "Alert toggled" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      const { id } = c.req.valid("param");
      const { active } = c.req.valid("json");
      const result = await toggleAlertRule(userId, id, active);
      if (!result) return c.json({ error: "Not found" }, 404);
      return c.json(result, 200);
    },
  )

  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      tags: ["Alerts"],
      summary: "Delete alert rule",
      request: { params: AlertParamsSchema },
      responses: { 200: { description: "Alert deleted" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      const { id } = c.req.valid("param");
      const result = await deleteAlertRule(userId, id);
      if (!result) return c.json({ error: "Not found" }, 404);
      return c.json(result, 200);
    },
  );
