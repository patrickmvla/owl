import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { calculateSettlementPaths } from "../services/path-calculator";
import { getGasEstimates, type GasEstimate } from "../services/gas-estimator";
import { getBinancePrice } from "@/features/market/services/binance-client";
import { SETTLEMENT_CHAINS } from "@/lib/constants/chains";
import { cached } from "@/lib/utils/cache";

/**
 * Fetch stablecoin prices — Binance first, CoinGecko fallback for missing pairs.
 * EURC and PYUSD aren't on Binance so they use CoinGecko.
 */
async function getStablecoinPrices(): Promise<Map<string, number>> {
  return cached("settlement:stablecoin-prices", 30_000, async () => {
    const prices = new Map<string, number>();

    // Binance pairs (free, no auth) — DAI delisted from Binance, skip it
    const binanceSymbols = ["USDCUSDT", "FDUSDUSDT", "TUSDUSDT"];
    await Promise.all(
      binanceSymbols.map(async (symbol) => {
        try {
          const ticker = await getBinancePrice(symbol);
          prices.set(symbol.replace("USDT", ""), parseFloat(ticker.price));
        } catch { /* skip */ }
      }),
    );

    // USDT is the quote currency — always $1.00
    prices.set("USDT", 1.0);

    // CoinGecko fallback for coins not on Binance
    const missingCoins: Record<string, string> = {};
    if (!prices.has("DAI")) missingCoins["dai"] = "DAI";
    if (!prices.has("PYUSD")) missingCoins["paypal-usd"] = "PYUSD";
    if (!prices.has("EURC")) missingCoins["euro-coin"] = "EURC";

    if (Object.keys(missingCoins).length > 0) {
      try {
        const ids = Object.keys(missingCoins).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
          { headers: { accept: "application/json" } },
        );
        if (res.ok) {
          const data = await res.json() as Record<string, { usd?: number }>;
          for (const [cgId, symbol] of Object.entries(missingCoins)) {
            const price = data[cgId]?.usd;
            if (price != null) {
              prices.set(symbol, price);
            }
          }
        }
      } catch { /* CoinGecko fallback failed — use $1.00 assumption */ }
    }

    // Final fallback — assume $1.00 for any missing stablecoin
    for (const chain of SETTLEMENT_CHAINS) {
      for (const stablecoin of chain.stablecoins) {
        if (!prices.has(stablecoin)) {
          prices.set(stablecoin, 1.0);
        }
      }
    }

    return prices;
  });
}

export const settlementRoutes = new OpenAPIHono()

  .openapi(
    createRoute({
      method: "get",
      path: "/paths",
      tags: ["Settlement"],
      summary: "Settlement paths",
      description: "Calculate optimal settlement paths with live gas fees and stablecoin prices",
      request: {
        query: z.object({
          amount: z.string().openapi({
            param: { name: "amount", in: "query" },
            example: "1000",
          }),
        }),
      },
      responses: {
        200: {
          content: { "application/json": { schema: z.any() } },
          description: "Settlement paths sorted by net value",
        },
        400: { description: "Invalid amount" },
      },
    }),
    async (c) => {
      const { amount } = c.req.valid("query");
      const inputUsd = parseFloat(amount);

      if (isNaN(inputUsd) || inputUsd <= 0) {
        return c.json({ error: "Invalid amount" }, 400);
      }

      const [gasEstimates, stablecoinPrices] = await Promise.all([
        getGasEstimates(),
        getStablecoinPrices(),
      ]);

      const chainsWithLiveGas = SETTLEMENT_CHAINS.map((chain) => {
        const liveGas = gasEstimates.find((g) => g.chainId === chain.id);
        const liveUsd = liveGas?.estimatedUsd;
        return {
          ...chain,
          // Use live gas if it's a valid positive number, otherwise keep static fallback
          estimatedGasUsd: (liveUsd != null && liveUsd > 0 && isFinite(liveUsd))
            ? liveUsd
            : chain.estimatedGasUsd,
        };
      });

      const paths = calculateSettlementPaths(inputUsd, stablecoinPrices, chainsWithLiveGas);

      // Build gas source detail for tooltip — report actual source used
      const gasDetail = gasEstimates.map((g) => {
        const liveUsable = g.estimatedUsd != null && g.estimatedUsd > 0 && isFinite(g.estimatedUsd);
        const chain = chainsWithLiveGas.find((c) => c.id === g.chainId);
        return {
          chain: g.chainId,
          source: liveUsable ? "live" as const : "fallback" as const,
          usd: chain?.estimatedGasUsd ?? g.estimatedUsd ?? 0,
        };
      });

      const liveGasCount = gasDetail.filter((g) => g.source === "live").length;

      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

      return c.json({
        inputUsd,
        paths,
        gasDataSource: `${liveGasCount}/${gasDetail.length} live`,
        gasDetail,
        timestamp: Date.now(),
      }, 200);
    },
  );
