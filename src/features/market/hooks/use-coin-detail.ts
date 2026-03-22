"use client";

import { useQuery } from "@tanstack/react-query";
import type { CoinDetail } from "../types";

export function useCoinDetail(id: string) {
  return useQuery<CoinDetail>({
    queryKey: ["market", "coin", id],
    queryFn: async () => {
      const res = await fetch(`/api/v0/market/coins/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch coin: ${id}`);
      return res.json();
    },
    staleTime: 60 * 1000, // 1 min
    enabled: !!id,
  });
}
