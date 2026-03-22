"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useCoinDetail } from "../hooks/use-coin-detail";
import { PriceChart } from "./price-chart";
import { formatPrice, formatPercent, formatCompact, formatNumber } from "@/lib/utils/format";

const TIME_RANGES = ["1", "7", "30", "90", "365"] as const;
const TIME_LABELS: Record<string, string> = {
  "1": "1D",
  "7": "1W",
  "30": "1M",
  "90": "3M",
  "365": "1Y",
};

interface CoinDetailProps {
  coinId: string;
}

export function CoinDetail({ coinId }: CoinDetailProps) {
  const { data: coin, isLoading } = useCoinDetail(coinId);
  const [days, setDays] = useState("30");

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-[400px] animate-pulse rounded-sm bg-card" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Coin not found</p>
      </div>
    );
  }

  const price = coin.market_data?.current_price?.usd ?? 0;
  const change24h = coin.market_data?.price_change_percentage_24h ?? 0;
  const isPositive = change24h >= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <Link href="/market" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <img
          src={coin.image?.large}
          alt={coin.name}
          width={24}
          height={24}
          className="rounded-full"
        />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{coin.name}</span>
          <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
        </div>
        <div className="flex items-baseline gap-2 ml-auto">
          <span className="text-xl font-semibold tabular-nums">
            {formatPrice(price)}
          </span>
          <span className={`text-xs tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
            {formatPercent(change24h)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 pt-4">
          <div className="flex gap-1 mb-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setDays(range)}
                className={`px-2.5 py-1 text-xs tabular-nums transition-colors ${
                  days === range
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TIME_LABELS[range]}
              </button>
            ))}
          </div>

          <PriceChart coinId={coinId} days={days} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px border-t border-border mt-4 bg-border lg:grid-cols-4">
          {[
            { label: "MKT CAP", value: formatCompact(coin.market_data?.market_cap?.usd ?? 0) },
            { label: "24H VOL", value: formatCompact(coin.market_data?.total_volume?.usd ?? 0) },
            { label: "CIRC SUPPLY", value: `${formatNumber(coin.market_data?.circulating_supply ?? 0, 0)} ${coin.symbol.toUpperCase()}` },
            { label: "MAX SUPPLY", value: coin.market_data?.max_supply ? formatNumber(coin.market_data.max_supply, 0) : "∞" },
            { label: "ATH", value: formatPrice(coin.market_data?.ath?.usd ?? 0) },
            { label: "ATL", value: formatPrice(coin.market_data?.atl?.usd ?? 0) },
            { label: "7D", value: formatPercent(coin.market_data?.price_change_percentage_7d ?? null) },
            { label: "30D", value: formatPercent(coin.market_data?.price_change_percentage_30d ?? null) },
          ].map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-3 space-y-0.5">
              <span className="label-micro">{stat.label}</span>
              <div className="text-xs font-medium tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
