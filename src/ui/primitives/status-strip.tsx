"use client";

import { PriceDisplay } from "./price-display";
import { usePrice } from "@/features/real-time/stores/price-store";
import { formatPercent } from "@/lib/utils/format";

const TICKER_SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];

function TickerItem({ symbol }: { symbol: string }) {
  const update = usePrice(symbol);
  const isPositive = (update?.change24h ?? 0) >= 0;

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{symbol.split("/")[0]}</span>
      <PriceDisplay symbol={symbol} className="text-xs" />
      {update?.change24h != null && (
        <span className={`tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
          {formatPercent(update.change24h)}
        </span>
      )}
    </span>
  );
}

export function StatusStrip() {
  return (
    <div className="flex h-[var(--status-strip-height)] shrink-0 items-center gap-6 overflow-x-auto border-t border-border bg-card px-4 text-xs">
      {TICKER_SYMBOLS.map((symbol) => (
        <TickerItem key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
