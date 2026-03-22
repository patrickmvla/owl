import { z } from "@hono/zod-openapi";

export const WatchlistParamsSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
  }),
});

export const ItemParamsSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
  }),
  itemId: z.string().uuid().openapi({
    param: { name: "itemId", in: "path" },
  }),
});

export const CreateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).default("My Watchlist").openapi({ example: "Crypto Watch" }),
}).openapi("CreateWatchlist");

export const AddItemSchema = z.object({
  symbol: z.string().min(1).max(20).openapi({ example: "BTC" }),
  asset_type: z.enum(["stock", "crypto"]).openapi({ example: "crypto" }),
}).openapi("AddWatchlistItem");
