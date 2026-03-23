"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Fetches exchange rates from CoinGecko (BTC-base rates).
 * Used to convert prices from USD to user's preferred currency.
 */
export function useExchangeRates() {
  return useQuery<Record<string, { name: string; unit: string; value: number; type: string }>>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const res = await fetch("/api/v0/market/exchange-rates");
      if (!res.ok) throw new Error("Failed to fetch exchange rates");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
