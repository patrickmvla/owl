"use client";

import { useQuery } from "@tanstack/react-query";
import { STABLECOINS } from "@/lib/constants/stablecoins";

interface DeviationPoint {
  time: number; // unix seconds
  value: number; // deviation %
}

export interface PegHistoryData {
  symbol: string;
  pegCurrency: string;
  pegTarget: number;
  points: DeviationPoint[];
}

/**
 * Fetch historical price data for all stablecoins and compute
 * deviation from peg over time.
 */
export function usePegHistory(days = "7") {
  return useQuery<PegHistoryData[]>({
    queryKey: ["peg", "history", days],
    queryFn: async () => {
      const results = await Promise.all(
        STABLECOINS.map(async (config) => {
          try {
            const res = await fetch(
              `/api/v0/market/coins/${config.id}/chart?currency=usd&days=${days}`,
            );
            if (!res.ok) return { symbol: config.symbol, pegCurrency: config.pegCurrency, pegTarget: config.pegTarget, points: [] };

            const data: { prices: [number, number][] } = await res.json();

            const points: DeviationPoint[] = data.prices.map(([timeMs, price]) => ({
              time: Math.floor(timeMs / 1000),
              value: ((price - config.pegTarget) / config.pegTarget) * 100,
            }));

            return {
              symbol: config.symbol,
              pegCurrency: config.pegCurrency,
              pegTarget: config.pegTarget,
              points,
            };
          } catch {
            return { symbol: config.symbol, pegCurrency: config.pegCurrency, pegTarget: config.pegTarget, points: [] };
          }
        }),
      );

      return results;
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
