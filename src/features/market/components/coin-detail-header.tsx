"use client";

import Link from "next/link";
import { ArrowLeft, Star, Bell } from "@phosphor-icons/react";
import { PriceDisplay } from "@/ui/primitives/price-display";
import { useWatchlistSymbols } from "@/features/watchlist/hooks/use-watchlist-symbols";
import { formatPercent } from "@/lib/utils/format";

interface CoinDetailHeaderProps {
  coinId: string;
  name: string;
  symbol: string;
  image: string;
  rank: number | null;
  fallbackPrice: number;
  change24h: number;
  ath: number;
}

/**
 * Client Component — needs useWatchlistSymbols (Zustand) and PriceDisplay (WS).
 * Only the interactive header is client. Stats, description, links stay server.
 */
export function CoinDetailHeader({
  coinId,
  name,
  symbol,
  image,
  rank,
  fallbackPrice,
  change24h,
  ath,
}: CoinDetailHeaderProps) {
  const { watchedSymbols, toggleSymbol } = useWatchlistSymbols();
  const isPositive = change24h >= 0;
  const isWatched = watchedSymbols.has(symbol);
  const wsSymbol = `${symbol}/USDT`;
  const athDistance = ath > 0 ? ((fallbackPrice - ath) / ath) * 100 : 0;

  return (
    <>
      {/* Nav bar */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <Link href="/market" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <img src={image} alt={name} width={24} height={24} className="rounded-full" />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground uppercase">{symbol}</span>
          {rank && <span className="text-[10px] text-muted-foreground">#{rank}</span>}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => toggleSymbol(symbol)}
            className="cursor-pointer flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star size={14} weight={isWatched ? "fill" : "regular"} className={isWatched ? "text-warning" : ""} />
            {isWatched ? "Watching" : "Watch"}
          </button>
          <Link
            href="/alerts"
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={14} />
            Alert
          </Link>
        </div>
      </div>

      {/* Price hero */}
      <div className="px-6 pt-4 flex items-baseline gap-3">
        <PriceDisplay symbol={wsSymbol} fallbackPrice={fallbackPrice} className="text-2xl font-semibold" />
        <span className={`text-xs tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
          {formatPercent(change24h)}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {athDistance < 0 ? `${athDistance.toFixed(1)}% from ATH` : "At ATH"}
        </span>
      </div>
    </>
  );
}
