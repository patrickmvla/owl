import { getGlobalData } from "../services/coingecko-client";
import { formatCompact, formatPercent } from "@/lib/utils/format";

/**
 * Server Component — fetches global market data directly.
 * No 'use client', no hooks, no TanStack Query.
 * Pure HTML, zero JS shipped to the client.
 *
 * ADR-005 Principle 1: "Every component defaults to a Server Component."
 */
export async function GlobalStats() {
  const global = await getGlobalData();

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
            {"change" in stat && stat.change && (
              <span
                className={`text-xs tabular-nums ${
                  "isPositive" in stat && stat.isPositive ? "price-up" : "price-down"
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
