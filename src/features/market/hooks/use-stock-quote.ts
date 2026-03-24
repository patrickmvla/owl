"use client";

import { useQuery } from "@tanstack/react-query";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ["stock", "quote", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/v0/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed to fetch stock quote");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // poll every 60s (Finnhub free tier is ~15min delayed)
    enabled: !!symbol,
  });
}

export function useStockProfile(symbol: string) {
  return useQuery({
    queryKey: ["stock", "profile", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/v0/stocks/profile?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h — company info rarely changes
    enabled: !!symbol,
  });
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ["stock", "search", query],
    queryFn: async () => {
      const res = await fetch(`/api/v0/stocks/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Stock search failed");
      return res.json() as Promise<{ count: number; result: { description: string; displaySymbol: string; symbol: string; type: string }[] }>;
    },
    staleTime: 5 * 60 * 1000,
    enabled: query.length >= 1,
  });
}

export function useStockCandles(symbol: string, days = 90) {
  return useQuery({
    queryKey: ["stock", "candles", symbol, days],
    queryFn: async () => {
      const res = await fetch(`/api/v0/stocks/candles?symbol=${encodeURIComponent(symbol)}&days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch stock candles");
      return res.json() as Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]>;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!symbol,
  });
}
