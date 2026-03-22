import { z } from "@hono/zod-openapi";

export const AssetTypeSchema = z.enum(["stock", "crypto"]).openapi("AssetType");

/** Create portfolio request */
export const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).openapi({ example: "My Portfolio" }),
}).openapi("CreatePortfolio");

/** Create holding request */
export const CreateHoldingSchema = z.object({
  symbol: z.string().min(1).max(20).openapi({ example: "BTC" }),
  asset_type: AssetTypeSchema,
  quantity: z.string().openapi({ example: "0.5" }), // string for numeric precision
  avg_cost_basis: z.string().openapi({ example: "42000.00" }),
  currency: z.string().default("USD").openapi({ example: "USD" }),
}).openapi("CreateHolding");

/** Update holding request */
export const UpdateHoldingSchema = z.object({
  quantity: z.string().optional().openapi({ example: "1.0" }),
  avg_cost_basis: z.string().optional().openapi({ example: "45000.00" }),
}).openapi("UpdateHolding");

/** Portfolio path params */
export const PortfolioParamsSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
});

/** Holding path params */
export const HoldingParamsSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  holdingId: z.string().uuid().openapi({
    param: { name: "holdingId", in: "path" },
    example: "660e8400-e29b-41d4-a716-446655440000",
  }),
});

/** Portfolio response */
export const PortfolioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}).openapi("Portfolio");

/** Holding response */
export const HoldingSchema = z.object({
  id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
  symbol: z.string(),
  asset_type: AssetTypeSchema,
  quantity: z.string(),
  avg_cost_basis: z.string(),
  currency: z.string(),
  added_at: z.string(),
  updated_at: z.string(),
}).openapi("Holding");
