"use client";

import { useQuery } from "@tanstack/react-query";
import type { SettlementPath } from "../services/path-calculator";

interface GasDetail {
  chain: string;
  source: "live" | "fallback";
  usd: number;
}

export interface SettlementResult {
  inputUsd: number;
  paths: SettlementPath[];
  gasDataSource: string;
  gasDetail: GasDetail[];
  timestamp: number;
}

export function useSettlementPaths(amount: string) {
  return useQuery<SettlementResult>({
    queryKey: ["settlement", amount],
    queryFn: async () => {
      const res = await fetch(`/api/v0/settlement/paths?amount=${encodeURIComponent(amount)}`);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Settlement failed: ${res.status} ${body}`);
      }
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled: parseFloat(amount) > 0,
  });
}
