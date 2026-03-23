import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { getBinanceKlines } from "@/features/market/services/binance-client";
import { computeCorrelationMatrix } from "../services/correlation-engine";
import { cached } from "@/lib/utils/cache";

/** Default pairs for the correlation matrix */
const DEFAULT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
];

export const correlationRoutes = new OpenAPIHono()

  .openapi(
    createRoute({
      method: "get",
      path: "/matrix",
      tags: ["Correlation"],
      summary: "Correlation matrix",
      description: "Pearson correlation matrix between crypto assets using daily returns from Binance klines",
      request: {
        query: z.object({
          symbols: z.string().default(DEFAULT_SYMBOLS.join(",")).openapi({
            param: { name: "symbols", in: "query" },
            example: "BTCUSDT,ETHUSDT,SOLUSDT",
          }),
          days: z.string().default("90").openapi({
            param: { name: "days", in: "query" },
            example: "90",
          }),
        }),
      },
      responses: {
        200: {
          content: { "application/json": { schema: z.any() } },
          description: "Correlation matrix with symbol pairs and r values",
        },
      },
    }),
    async (c) => {
      const { symbols: symbolsStr, days } = c.req.valid("query");
      const symbols = symbolsStr.split(",").map((s) => s.trim().toUpperCase());
      const limit = Math.min(parseInt(days, 10), 365);

      const cacheKey = `correlation:${symbols.join(",")}:${limit}`;

      const result = await cached(cacheKey, 10 * 60 * 1000, async () => {
        // Fetch daily klines for each symbol in parallel
        const priceData = new Map<string, number[]>();

        await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const klines = await getBinanceKlines(symbol, "1d", limit);
              const closes = klines.map((k) => parseFloat(k[4]));
              priceData.set(symbol, closes);
            } catch {
              // Symbol not available — skip
            }
          }),
        );

        // Compute correlation matrix
        const availableSymbols = symbols.filter((s) => priceData.has(s));
        const pairs = computeCorrelationMatrix(availableSymbols, priceData);

        // Build matrix for easy frontend consumption
        const matrix: Record<string, Record<string, number | null>> = {};
        for (const s of availableSymbols) {
          matrix[s] = {};
          matrix[s]![s] = 1.0; // self-correlation
        }
        for (const pair of pairs) {
          if (!matrix[pair.symbolA]) matrix[pair.symbolA] = {};
          if (!matrix[pair.symbolB]) matrix[pair.symbolB] = {};
          matrix[pair.symbolA]![pair.symbolB] = pair.correlation;
          matrix[pair.symbolB]![pair.symbolA] = pair.correlation;
        }

        return {
          symbols: availableSymbols,
          pairs,
          matrix,
          days: limit,
        };
      });

      c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");
      return c.json(result, 200);
    },
  );
