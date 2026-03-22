"use client";

import { useMarketOverview } from "../hooks/use-market-overview";

export function TrendingList() {
  const { data, isLoading } = useMarketOverview();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (!data?.trending?.length) return null;

  return (
    <div className="space-y-1">
      <span className="label-micro">Trending</span>
      <div className="space-y-0.5">
        {data.trending.slice(0, 7).map((coin, i) => (
          <div
            key={coin.item.id}
            className="flex items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-muted"
          >
            <span className="w-4 text-xs text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            <img
              src={coin.item.thumb}
              alt={coin.item.name}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-xs font-medium">{coin.item.symbol.toUpperCase()}</span>
            <span className="text-xs text-muted-foreground">{coin.item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
