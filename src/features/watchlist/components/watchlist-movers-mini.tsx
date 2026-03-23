"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useWatchlists, useWatchlistItems } from "../hooks/use-watchlist";
import { useThrottledPriceVersion } from "@/features/real-time/stores/price-store";
import { priceStore } from "@/features/real-time/stores/price-store";
import { formatPercent } from "@/lib/utils/format";
import { PriceDisplay } from "@/ui/primitives/price-display";

export function WatchlistMoversMini() {
  const { data: watchlists } = useWatchlists();
  const activeWatchlist = watchlists?.[0];
  const { data: items } = useWatchlistItems(activeWatchlist?.id ?? "");
  const version = useThrottledPriceVersion();

  const movers = useMemo(() => {
    if (!items?.length) return [];

    const store = priceStore.getState();

    return [...items]
      .map((item: any) => {
        const update = store.prices.get(`${item.symbol}/USDT`);
        return {
          symbol: item.symbol as string,
          change: update?.change24h ?? 0,
        };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 4);
  }, [items, version]);

  if (!activeWatchlist) {
    return (
      <Link
        href="/watchlist"
        className="flex h-20 items-center justify-between rounded-sm border border-border/50 bg-card px-4 hover:bg-muted/50 transition-colors"
      >
        <div>
          <span className="label-micro">Watchlist</span>
          <div className="text-xs text-muted-foreground mt-1">Add coins to track</div>
        </div>
        <ArrowRight size={14} className="text-muted-foreground" />
      </Link>
    );
  }

  return (
    <Link
      href="/watchlist"
      className="flex h-20 flex-col justify-center rounded-sm border border-border/50 bg-card px-4 hover:bg-muted/50 transition-colors"
    >
      <span className="label-micro">Watchlist Movers</span>
      {movers.length === 0 ? (
        <div className="text-xs text-muted-foreground mt-1">No live data yet</div>
      ) : (
        <div className="flex items-center gap-3 mt-1">
          {movers.map((m) => (
            <span key={m.symbol} className="text-[10px] tabular-nums">
              <span className="text-xs font-medium">{m.symbol}</span>{" "}
              <span className={m.change >= 0 ? "price-up" : "price-down"}>
                {formatPercent(m.change)}
              </span>
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
