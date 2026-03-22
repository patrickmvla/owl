"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePriceVersion } from "@/features/real-time/stores/price-store";
import { priceStore } from "@/features/real-time/stores/price-store";
import { STABLECOINS, REST_STABLECOINS } from "@/lib/constants/stablecoins";
import { calculateDeviation, getWorstStatus, type PegData } from "../services/deviation-calculator";

/**
 * Fetch prices for stablecoins not available on Binance WS.
 * Uses CoinGecko simple/price endpoint.
 */
function useRestStablecoinPrices() {
  const ids = REST_STABLECOINS.map((s) => s.id).join(",");

  return useQuery<Record<string, { usd?: number; eur?: number }>>({
    queryKey: ["peg", "rest-prices"],
    queryFn: async () => {
      if (!ids) return {};
      const res = await fetch(`/api/v0/market/coins?currency=usd&per_page=250&page=1`);
      if (!res.ok) return {};
      const coins: any[] = await res.json();

      const priceMap: Record<string, { usd?: number; eur?: number }> = {};
      for (const stablecoin of REST_STABLECOINS) {
        const coin = coins.find((c: any) =>
          c.symbol?.toLowerCase() === stablecoin.symbol.toLowerCase()
        );
        if (coin) {
          priceMap[stablecoin.symbol] = { usd: coin.current_price };
        }
      }
      return priceMap;
    },
    staleTime: 60 * 1000, // 1 min
    refetchInterval: 60 * 1000, // poll every minute for REST stablecoins
  });
}

/**
 * Derives peg status for all monitored stablecoins.
 * WS-covered coins update in real-time. REST-only coins update every 60s.
 */
export function usePegMonitor() {
  const version = usePriceVersion();
  const { data: restPrices } = useRestStablecoinPrices();

  const pegs = useMemo((): PegData[] => {
    const store = priceStore.getState();

    return STABLECOINS.map((config) => {
      let price: number | null = null;

      // Try Binance WS first
      if (config.wsSymbol) {
        const update = store.prices.get(config.wsSymbol);
        if (update) {
          price = update.price;
        }
      }

      // Fall back to CoinGecko REST
      if (price == null && restPrices) {
        const restData = restPrices[config.symbol];
        if (restData?.usd != null) {
          price = restData.usd;
        }
      }

      if (price == null) {
        return { config, price: null, deviation: null, status: "unknown" as const };
      }

      const { deviation, status } = calculateDeviation(price, config);
      return { config, price, deviation, status };
    });
  }, [version, restPrices]);

  const worstStatus = useMemo(() => getWorstStatus(pegs), [pegs]);

  return { pegs, worstStatus };
}
