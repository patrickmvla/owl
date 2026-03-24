import { z } from "@hono/zod-openapi";

export const AlertParamsSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
  }),
});

export const CreateAlertSchema = z.object({
  symbol: z.string().min(1).max(20).openapi({ example: "BTC" }),
  asset_type: z.enum(["stock", "crypto"]).openapi({ example: "crypto" }),
  condition: z.enum(["price_above", "price_below", "peg_deviation"]).openapi({ example: "price_above" }),
  threshold: z.string().openapi({ example: "50000" }),
  notify_via: z.enum(["in_app", "email", "webhook"]).default("in_app").optional(),
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().min(16).optional(),
}).openapi("CreateAlert");

export const ToggleAlertSchema = z.object({
  active: z.boolean().openapi({ example: true }),
}).openapi("ToggleAlert");
