"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketChart } from "../types";

export function useMarketChart(
  id: string,
  currency = "usd",
  days = "30",
) {
  return useQuery<MarketChart>({
    queryKey: ["market", "chart", id, currency, days],
    queryFn: async () => {
      const params = new URLSearchParams({ currency, days });
      const res = await fetch(`/api/v0/market/coins/${id}/chart?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch chart: ${id}`);
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min
    enabled: !!id,
  });
}
