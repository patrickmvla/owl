"use client";

import { useQuery } from "@tanstack/react-query";
import type { GlobalData, TrendingCoin } from "../types";

interface MarketOverview {
  global: GlobalData;
  trending: TrendingCoin[];
}

export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ["market", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/v0/market/overview");
      if (!res.ok) throw new Error("Failed to fetch market overview");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min — matches server cache TTL
  });
}
