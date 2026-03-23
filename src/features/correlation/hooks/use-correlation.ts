"use client";

import { useQuery } from "@tanstack/react-query";

interface CorrelationResult {
  symbols: string[];
  pairs: { symbolA: string; symbolB: string; correlation: number | null; dataPoints: number }[];
  matrix: Record<string, Record<string, number | null>>;
  days: number;
}

export function useCorrelation(symbols?: string[], days = "90") {
  const symbolsParam = symbols?.join(",") ?? "BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT,ADAUSDT";

  return useQuery<CorrelationResult>({
    queryKey: ["correlation", symbolsParam, days],
    queryFn: async () => {
      const params = new URLSearchParams({ symbols: symbolsParam, days });
      const res = await fetch(`/api/v0/correlation/matrix?${params}`);
      if (!res.ok) throw new Error("Failed to fetch correlation");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
