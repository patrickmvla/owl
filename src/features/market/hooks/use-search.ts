"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "../types";

export function useSearch(query: string) {
  return useQuery<SearchResult>({
    queryKey: ["market", "search", query],
    queryFn: async () => {
      const res = await fetch(`/api/v0/market/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: query.length >= 2,
  });
}
