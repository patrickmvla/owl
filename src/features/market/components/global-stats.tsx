"use client";

import { useMarketOverview } from "../hooks/use-market-overview";
import { formatCompact, formatPercent } from "@/lib/utils/format";

export function GlobalStats() {
  const { data, isLoading } = useMarketOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { global } = data;
  const cap = global.total_market_cap?.usd ?? 0;
  const vol = global.total_volume?.usd ?? 0;
  const btcDom = global.market_cap_percentage?.btc ?? 0;
  const change = global.market_cap_change_percentage_24h_usd ?? 0;

  const stats = [
    {
      label: "MKT CAP",
      value: formatCompact(cap),
      change: formatPercent(change),
      isPositive: change >= 0,
    },
    {
      label: "24H VOL",
      value: formatCompact(vol),
    },
    {
      label: "BTC DOM",
      value: `${btcDom.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="space-y-1 rounded-sm border border-border bg-card p-4">
          <span className="label-micro">{stat.label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">{stat.value}</span>
            {stat.change && (
              <span
                className={`text-xs tabular-nums ${
                  stat.isPositive ? "price-up" : "price-down"
                }`}
              >
                {stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
