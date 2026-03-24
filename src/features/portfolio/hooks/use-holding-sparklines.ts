"use client";

import { useQuery } from "@tanstack/react-query";
import type { CoinMarket } from "@/features/market/types";

/**
 * Fetches sparkline data for portfolio holdings.
 * Uses CoinGecko /coins/markets with sparkline=true — same endpoint
 * as the market table, already cached.
 */
export function useHoldingSparklines(symbols: string[]) {
  return useQuery<Map<string, number[]>>({
    queryKey: ["holding-sparklines", symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return new Map();

      // Fetch top 250 coins with sparklines — our holdings should be in there
      const res = await fetch("/api/v0/market/coins?currency=usd&per_page=250&page=1");
      if (!res.ok) return new Map();

      const coins: CoinMarket[] = await res.json();
      const map = new Map<string, number[]>();

      for (const symbol of symbols) {
        const coin = coins.find(
          (c) => c.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        if (coin?.sparkline_in_7d?.price) {
          map.set(symbol.toUpperCase(), coin.sparkline_in_7d.price);
        }
      }

      return map;
    },
    staleTime: 5 * 60 * 1000,
    enabled: symbols.length > 0,
  });
}
