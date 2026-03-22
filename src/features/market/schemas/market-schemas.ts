import { z } from "@hono/zod-openapi";

/** Query params for coin list */
export const CoinsQuerySchema = z.object({
  currency: z.string().default("usd").openapi({
    param: { name: "currency", in: "query" },
    example: "usd",
  }),
  page: z.string().default("1").openapi({
    param: { name: "page", in: "query" },
    example: "1",
  }),
  per_page: z.string().default("50").openapi({
    param: { name: "per_page", in: "query" },
    example: "50",
  }),
});

/** Path params for coin detail */
export const CoinParamsSchema = z.object({
  id: z.string().min(1).openapi({
    param: { name: "id", in: "path" },
    example: "bitcoin",
  }),
});

/** Query params for chart */
export const ChartQuerySchema = z.object({
  currency: z.string().default("usd").openapi({
    param: { name: "currency", in: "query" },
    example: "usd",
  }),
  days: z.string().default("30").openapi({
    param: { name: "days", in: "query" },
    example: "30",
  }),
});

/** Query params for search */
export const SearchQuerySchema = z.object({
  q: z.string().min(2).openapi({
    param: { name: "q", in: "query" },
    example: "ethereum",
  }),
});

/** Global data response shape */
export const GlobalDataSchema = z.object({
  total_market_cap: z.record(z.string(), z.number()),
  total_volume: z.record(z.string(), z.number()),
  market_cap_percentage: z.record(z.string(), z.number()),
  market_cap_change_percentage_24h_usd: z.number(),
  active_cryptocurrencies: z.number(),
  markets: z.number(),
}).openapi("GlobalData");

/** Coin market item shape */
export const CoinMarketSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().nullable(),
  total_volume: z.number(),
  price_change_percentage_24h: z.number().nullable(),
  sparkline_in_7d: z.object({ price: z.array(z.number()) }).optional(),
}).openapi("CoinMarket");

/** Market overview response */
export const MarketOverviewSchema = z.object({
  global: GlobalDataSchema,
  trending: z.array(z.any()),
}).openapi("MarketOverview");

/** Market chart response */
export const MarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
}).openapi("MarketChart");

/** Search result response */
export const SearchResultSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      market_cap_rank: z.number().nullable(),
      thumb: z.string(),
      large: z.string(),
    }),
  ),
}).openapi("SearchResult");
