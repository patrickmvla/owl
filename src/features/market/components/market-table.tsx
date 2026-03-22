"use client";

import Link from "next/link";
import { useCoinsMarket } from "../hooks/use-coins-market";
import { formatPrice, formatPercent, formatCompact } from "@/lib/utils/format";
import { Sparkline } from "@/ui/primitives/sparkline";

interface MarketTableProps {
  limit?: number;
}

export function MarketTable({ limit }: MarketTableProps) {
  const { data: coins, isLoading } = useCoinsMarket("usd", 1, limit ?? 50);

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(limit ?? 10)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (!coins?.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="label-micro py-2 pr-2 text-left w-8">#</th>
            <th className="label-micro py-2 pr-4 text-left">Name</th>
            <th className="label-micro py-2 px-4 text-right">Price</th>
            <th className="label-micro py-2 px-4 text-right">24h</th>
            <th className="label-micro py-2 px-4 text-right">Mkt Cap</th>
            <th className="label-micro py-2 px-4 text-right">Volume</th>
            <th className="label-micro py-2 pl-4 text-right w-[100px]">7d</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => {
            const change = coin.price_change_percentage_24h;
            const isPositive = (change ?? 0) >= 0;

            return (
              <tr
                key={coin.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-2.5 pr-2 text-muted-foreground tabular-nums">
                  {coin.market_cap_rank}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/market/${coin.id}`}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    <img
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="font-medium">{coin.name}</span>
                    <span className="text-muted-foreground uppercase">
                      {coin.symbol}
                    </span>
                  </Link>
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">
                  {formatPrice(coin.current_price)}
                </td>
                <td
                  className={`py-2.5 px-4 text-right tabular-nums ${
                    isPositive ? "price-up" : "price-down"
                  }`}
                >
                  {formatPercent(change)}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">
                  {formatCompact(coin.market_cap)}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">
                  {formatCompact(coin.total_volume)}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  {coin.sparkline_in_7d?.price && (
                    <Sparkline
                      data={coin.sparkline_in_7d.price}
                      width={100}
                      height={32}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
