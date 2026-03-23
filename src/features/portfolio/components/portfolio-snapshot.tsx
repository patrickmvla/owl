"use client";

import Link from "next/link";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useMemo } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { usePortfolios } from "../hooks/use-portfolios";
import { useHoldings } from "../hooks/use-holdings";
import { useThrottledPriceVersion } from "@/features/real-time/stores/price-store";
import { priceStore } from "@/features/real-time/stores/price-store";
import { calculatePortfolioPnL } from "../services/pnl-calculator";
import { formatPrice, formatPercent } from "@/lib/utils/format";

export function PortfolioSnapshot() {
  const mounted = useMounted();
  const { data: portfolios, isLoading: loadingPortfolios } = usePortfolios();
  const activePortfolio = portfolios?.[0];
  const { data: holdings, isLoading: loadingHoldings } = useHoldings(activePortfolio?.id ?? "");
  const version = useThrottledPriceVersion();

  const summary = useMemo(() => {
    if (!holdings?.length) return null;

    const prices = new Map<string, number>();
    const store = priceStore.getState();
    for (const h of holdings) {
      const liveUpdate = store.prices.get(`${(h as any).symbol}/USDT`);
      if (liveUpdate) {
        prices.set((h as any).symbol, liveUpdate.price);
      }
    }

    return calculatePortfolioPnL(
      holdings.map((h: any) => ({
        id: h.id,
        symbol: h.symbol,
        assetType: h.assetType,
        quantity: h.quantity,
        avgCostBasis: h.avgCostBasis,
        currency: h.currency,
      })),
      prices,
    );
  }, [holdings, version]);

  if (!mounted || loadingPortfolios || loadingHoldings) {
    return <div className="h-20 animate-pulse rounded-sm bg-card" />;
  }

  if (!activePortfolio || !summary) {
    return (
      <Link
        href="/portfolio"
        className="flex h-20 items-center justify-between rounded-sm border border-border/50 bg-card px-4 hover:bg-muted/50 transition-colors"
      >
        <div>
          <span className="label-micro">Portfolio</span>
          <div className="text-xs text-muted-foreground mt-1">Add holdings to track P&L</div>
        </div>
        <ArrowRight size={14} className="text-muted-foreground" />
      </Link>
    );
  }

  const isPositive = summary.totalUnrealizedPnL >= 0;

  return (
    <Link
      href="/portfolio"
      className="flex h-20 flex-col justify-center rounded-sm border border-border/50 bg-card px-4 hover:bg-muted/50 transition-colors"
    >
      <span className="label-micro">Portfolio Value</span>
      <div className="text-lg font-semibold tabular-nums mt-0.5">
        {formatPrice(summary.totalCurrentValue)}
      </div>
      <div className={`text-[10px] tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
        {isPositive ? "+" : ""}{formatPrice(summary.totalUnrealizedPnL)} ({formatPercent(summary.totalUnrealizedPnLPercent)})
      </div>
    </Link>
  );
}
