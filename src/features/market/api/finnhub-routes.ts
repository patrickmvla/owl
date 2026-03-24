import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  getStockQuote,
  getCompanyProfile,
  searchStocks,
  getStockCandles,
  candlesToOHLCV,
} from "../services/finnhub-client";

export const finnhubRoutes = new OpenAPIHono()

  /** Stock quote */
  .openapi(
    createRoute({
      method: "get",
      path: "/quote",
      tags: ["Stocks"],
      summary: "Stock quote",
      description: "Real-time stock quote from Finnhub (~15min delay on free tier)",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "AAPL" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "Stock quote" },
      },
    }),
    async (c) => {
      const { symbol } = c.req.valid("query");
      const quote = await getStockQuote(symbol);

      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

      return c.json({
        symbol: symbol.toUpperCase(),
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
        timestamp: quote.t,
      }, 200);
    },
  )

  /** Company profile */
  .openapi(
    createRoute({
      method: "get",
      path: "/profile",
      tags: ["Stocks"],
      summary: "Company profile",
      description: "Company info: name, logo, industry, market cap",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "AAPL" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "Company profile" },
        404: { description: "Company not found" },
      },
    }),
    async (c) => {
      const { symbol } = c.req.valid("query");
      const profile = await getCompanyProfile(symbol);

      if (!profile) {
        return c.json({ error: "Company not found" }, 404);
      }

      c.header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");

      return c.json(profile, 200);
    },
  )

  /** Stock search */
  .openapi(
    createRoute({
      method: "get",
      path: "/search",
      tags: ["Stocks"],
      summary: "Search stocks",
      description: "Search US stocks by name or ticker",
      request: {
        query: z.object({
          q: z.string().min(1).openapi({ param: { name: "q", in: "query" }, example: "apple" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "Search results" },
      },
    }),
    async (c) => {
      const { q } = c.req.valid("query");
      const results = await searchStocks(q);

      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

      return c.json(results, 200);
    },
  )

  /** Historical stock candles via Yahoo Finance (Finnhub candles require paid plan) */
  .openapi(
    createRoute({
      method: "get",
      path: "/candles",
      tags: ["Stocks"],
      summary: "Stock candles (Yahoo Finance)",
      description: "Historical daily OHLCV via yahoo-finance2. Finnhub candles require paid plan.",
      request: {
        query: z.object({
          symbol: z.string().openapi({ param: { name: "symbol", in: "query" }, example: "AAPL" }),
          days: z.string().default("90").openapi({ param: { name: "days", in: "query" }, example: "90" }),
        }),
      },
      responses: {
        200: { content: { "application/json": { schema: z.any() } }, description: "OHLCV data or error" },
      },
    }),
    async (c) => {
      try {
        const { symbol, days } = c.req.valid("query");
        const { getStockCandles: getYahooCandles } = await import("../services/yahoo-client");
        const ohlcv = await getYahooCandles(symbol, parseInt(days, 10));

        c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");
        return c.json(ohlcv, 200);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json({ error: message, source: "yahoo-finance2" }, 200);
      }
    },
  );
