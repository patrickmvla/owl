"use client";

import { useQuery } from "@tanstack/react-query";
import type { CoinMarket } from "../types";

export function useCoinsMarket(
  currency = "usd",
  page = 1,
  perPage = 50,
) {
  return useQuery<CoinMarket[]>({
    queryKey: ["market", "coins", currency, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        currency,
        page: page.toString(),
        per_page: perPage.toString(),
      });
      const res = await fetch(`/api/v0/market/coins?${params}`);
      if (!res.ok) throw new Error("Failed to fetch coins");
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
