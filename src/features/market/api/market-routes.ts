import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  getGlobalData,
  getCoinsMarkets,
  getCoinDetail,
  getMarketChart,
  getTrending,
  searchCoins,
  getExchangeRates,
} from "../services/coingecko-client";
import {
  CoinsQuerySchema,
  CoinParamsSchema,
  ChartQuerySchema,
  SearchQuerySchema,
  MarketOverviewSchema,
  CoinMarketSchema,
  MarketChartSchema,
  SearchResultSchema,
} from "../schemas/market-schemas";
import { z } from "@hono/zod-openapi";

export const marketRoutes = new OpenAPIHono()

  /** Global market stats + trending */
  .openapi(
    createRoute({
      method: "get",
      path: "/overview",
      tags: ["Market"],
      summary: "Market overview",
      description: "Global market stats and trending coins",
      responses: {
        200: {
          content: { "application/json": { schema: MarketOverviewSchema } },
          description: "Market overview data",
        },
      },
    }),
    async (c) => {
      const [global, trending] = await Promise.all([
        getGlobalData(),
        getTrending(),
      ]);

      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

      return c.json({ global, trending }, 200);
    },
  )

  /** Coins list (paginated) */
  .openapi(
    createRoute({
      method: "get",
      path: "/coins",
      tags: ["Market"],
      summary: "List coins",
      description: "Top coins by market cap, paginated",
      request: { query: CoinsQuerySchema },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(CoinMarketSchema) } },
          description: "List of coins",
        },
      },
    }),
    async (c) => {
      const { currency, page, per_page } = c.req.valid("query");
      const coins = await getCoinsMarkets(
        currency,
        parseInt(page, 10),
        parseInt(per_page, 10),
      );

      c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");

      return c.json(coins, 200);
    },
  )

  /** Single coin detail */
  .openapi(
    createRoute({
      method: "get",
      path: "/coins/{id}",
      tags: ["Market"],
      summary: "Coin detail",
      description: "Full detail for a single coin including market data",
      request: { params: CoinParamsSchema },
      responses: {
        200: {
          content: { "application/json": { schema: z.any() } },
          description: "Coin detail",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const coin = await getCoinDetail(id);

      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

      return c.json(coin, 200);
    },
  )

  /** Historical price chart */
  .openapi(
    createRoute({
      method: "get",
      path: "/coins/{id}/chart",
      tags: ["Market"],
      summary: "Price chart",
      description: "Historical price, market cap, and volume data",
      request: {
        params: CoinParamsSchema,
        query: ChartQuerySchema,
      },
      responses: {
        200: {
          content: { "application/json": { schema: MarketChartSchema } },
          description: "Chart data",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { currency, days } = c.req.valid("query");
      const chart = await getMarketChart(id, currency, days);

      c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");

      return c.json(chart, 200);
    },
  )

  /** Trending coins */
  .openapi(
    createRoute({
      method: "get",
      path: "/trending",
      tags: ["Market"],
      summary: "Trending coins",
      description: "Top trending coins on CoinGecko",
      responses: {
        200: {
          content: { "application/json": { schema: z.array(z.any()) } },
          description: "Trending coins",
        },
      },
    }),
    async (c) => {
      const trending = await getTrending();

      c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");

      return c.json(trending, 200);
    },
  )

  /** Search coins */
  .openapi(
    createRoute({
      method: "get",
      path: "/search",
      tags: ["Market"],
      summary: "Search coins",
      description: "Search for coins by name or symbol",
      request: { query: SearchQuerySchema },
      responses: {
        200: {
          content: { "application/json": { schema: SearchResultSchema } },
          description: "Search results",
        },
      },
    }),
    async (c) => {
      const { q } = c.req.valid("query");
      const results = await searchCoins(q);

      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

      return c.json(results, 200);
    },
  )

  /** Exchange rates */
  .openapi(
    createRoute({
      method: "get",
      path: "/exchange-rates",
      tags: ["Market"],
      summary: "Exchange rates",
      description: "BTC-base exchange rates for currency conversion (CoinGecko)",
      responses: {
        200: {
          content: { "application/json": { schema: z.any() } },
          description: "Exchange rates keyed by currency code",
        },
      },
    }),
    async (c) => {
      const rates = await getExchangeRates();

      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

      return c.json(rates, 200);
    },
  );
