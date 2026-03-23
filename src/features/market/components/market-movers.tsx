"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCoinsMarket } from "../hooks/use-coins-market";
import { formatPrice, formatPercent, formatCompact } from "@/lib/utils/format";

type Tab = "gainers" | "losers" | "active";

export function MarketMoversPanel() {
  const [tab, setTab] = useState<Tab>("gainers");
  const { data: coins } = useCoinsMarket("usd", 1, 50);

  const movers = useMemo(() => {
    if (!coins) return [];

    const sorted = [...coins];

    switch (tab) {
      case "gainers":
        return sorted
          .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
          .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
          .slice(0, 5);
      case "losers":
        return sorted
          .filter((c) => (c.price_change_percentage_24h ?? 0) < 0)
          .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
          .slice(0, 5);
      case "active":
        return sorted
          .sort((a, b) => b.total_volume - a.total_volume)
          .slice(0, 5);
    }
  }, [coins, tab]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {(["gainers", "losers", "active"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              tab === t
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-0.5">
        {movers.map((coin) => {
          const change = coin.price_change_percentage_24h ?? 0;
          const isPositive = change >= 0;
          const high = coin.high_24h ?? coin.current_price;
          const low = coin.low_24h ?? coin.current_price;
          const range = high - low;
          const position = range > 0 ? ((coin.current_price - low) / range) * 100 : 50;

          return (
            <Link
              key={coin.id}
              href={`/market/${coin.id}`}
              className="flex items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-muted/50 transition-colors"
            >
              <img src={coin.image} alt={coin.name} width={18} height={18} className="rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{coin.symbol.toUpperCase()}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{coin.name}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs tabular-nums">{formatPrice(coin.current_price)}</div>
                <div className={`text-[10px] tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
                  {formatPercent(change)}
                </div>
              </div>
              {/* 24h range bar */}
              <div className="w-12 shrink-0">
                <div className="relative h-1 w-full bg-muted rounded-full">
                  <div
                    className={`absolute top-0 h-1 w-1 rounded-full ${isPositive ? "bg-price-up" : "bg-price-down"}`}
                    style={{ left: `${Math.min(Math.max(position, 0), 100)}%`, transform: "translateX(-50%)" }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
