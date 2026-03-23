import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  getBinanceKlines,
  getBinanceTicker24hr,
  getBinancePrice,
  klinesToOHLCV,
} from "../services/binance-client";

export const binanceRoutes = new OpenAPIHono()

  /** Binance klines (candlestick data) */
  .openapi(
    createRoute({
      method: "get",
      path: "/klines",
      tags: ["Binance"],
      summary: "Candlestick/kline data",
      description: "Historical OHLCV data from Binance. No API key needed.",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "BTCUSDT" }),
          interval: z.string().default("1d").openapi({ param: { name: "interval", in: "query" }, example: "1d" }),
          limit: z.string().default("90").openapi({ param: { name: "limit", in: "query" }, example: "90" }),
        }),
      },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(z.any()) } },
          description: "OHLCV data",
        },
      },
    }),
    async (c) => {
      const { symbol, interval, limit } = c.req.valid("query");
      const klines = await getBinanceKlines(symbol, interval, parseInt(limit, 10));
      const ohlcv = klinesToOHLCV(klines);

      c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");
      return c.json(ohlcv, 200);
    },
  )

  /** Binance 24hr ticker */
  .openapi(
    createRoute({
      method: "get",
      path: "/ticker",
      tags: ["Binance"],
      summary: "24hr ticker stats",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "BTCUSDT" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "Ticker stats" },
      },
    }),
    async (c) => {
      const { symbol } = c.req.valid("query");
      const ticker = await getBinanceTicker24hr(symbol);

      c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
      return c.json(ticker, 200);
    },
  )

  /** Binance current price */
  .openapi(
    createRoute({
      method: "get",
      path: "/price",
      tags: ["Binance"],
      summary: "Current price",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "BTCUSDT" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "Price" },
      },
    }),
    async (c) => {
      const { symbol } = c.req.valid("query");
      const price = await getBinancePrice(symbol);

      c.header("Cache-Control", "public, s-maxage=30, stale-while-revalidate=15");
      return c.json({ symbol: price.symbol, price: parseFloat(price.price) }, 200);
    },
  );
