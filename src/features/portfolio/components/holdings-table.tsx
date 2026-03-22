"use client";

import { Trash } from "@phosphor-icons/react";
import { useHoldings, useDeleteHolding } from "../hooks/use-holdings";
import { usePrice } from "@/features/real-time/stores/price-store";
import { calculatePortfolioPnL, type HoldingWithPnL } from "../services/pnl-calculator";
import { formatPrice, formatPercent, formatNumber } from "@/lib/utils/format";
import { usePriceVersion } from "@/features/real-time/stores/price-store";
import { priceStore } from "@/features/real-time/stores/price-store";
import { useMemo } from "react";

function HoldingRow({
  holding,
  portfolioId,
}: {
  holding: HoldingWithPnL;
  portfolioId: string;
}) {
  const deleteHolding = useDeleteHolding(portfolioId);
  const isPositive = holding.unrealizedPnL >= 0;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/50 transition-colors">
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{holding.symbol}</span>
          <span className="text-[10px] text-muted-foreground uppercase">
            {holding.assetType}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-right tabular-nums text-xs">
        {formatNumber(holding.quantity, holding.assetType === "crypto" ? 6 : 2)}
      </td>
      <td className="py-2.5 px-4 text-right tabular-nums text-xs">
        {formatPrice(holding.avgCostBasis)}
      </td>
      <td className="py-2.5 px-4 text-right tabular-nums text-xs">
        {holding.currentPrice > 0 ? formatPrice(holding.currentPrice) : "—"}
      </td>
      <td className="py-2.5 px-4 text-right tabular-nums text-xs">
        {formatPrice(holding.currentValue)}
      </td>
      <td className={`py-2.5 px-4 text-right tabular-nums text-xs ${isPositive ? "price-up" : "price-down"}`}>
        <div>{formatPrice(holding.unrealizedPnL)}</div>
        <div className="text-[10px]">{formatPercent(holding.unrealizedPnLPercent)}</div>
      </td>
      <td className="py-2.5 px-4 text-right tabular-nums text-xs">
        {holding.allocation.toFixed(1)}%
      </td>
      <td className="py-2.5 pl-4">
        <button
          onClick={() => deleteHolding.mutate(holding.id)}
          disabled={deleteHolding.isPending}
          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <Trash size={14} />
        </button>
      </td>
    </tr>
  );
}

interface HoldingsTableProps {
  portfolioId: string;
}

export function HoldingsTable({ portfolioId }: HoldingsTableProps) {
  const { data: holdings, isLoading } = useHoldings(portfolioId);
  const version = usePriceVersion(); // re-render when any price updates

  const summary = useMemo(() => {
    if (!holdings?.length) return null;

    // Build price map from Zustand store
    const prices = new Map<string, number>();
    const store = priceStore.getState();
    for (const h of holdings) {
      // Try live price first (e.g., "BTC" → look for "BTC/USDT")
      const liveUpdate = store.prices.get(`${h.symbol}/USDT`);
      if (liveUpdate) {
        prices.set(h.symbol, liveUpdate.price);
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

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (!summary || summary.holdings.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No holdings yet. Add your first holding to start tracking.
      </div>
    );
  }

  const isPositive = summary.totalUnrealizedPnL >= 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-baseline gap-4">
        <div>
          <span className="label-micro">Total Value</span>
          <div className="text-2xl font-semibold tabular-nums">
            {formatPrice(summary.totalCurrentValue)}
          </div>
        </div>
        <div>
          <span className="label-micro">Unrealized P&L</span>
          <div className={`text-lg font-semibold tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
            {formatPrice(summary.totalUnrealizedPnL)} ({formatPercent(summary.totalUnrealizedPnLPercent)})
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="label-micro py-2 pr-4 text-left">Symbol</th>
              <th className="label-micro py-2 px-4 text-right">Qty</th>
              <th className="label-micro py-2 px-4 text-right">Cost Basis</th>
              <th className="label-micro py-2 px-4 text-right">Price</th>
              <th className="label-micro py-2 px-4 text-right">Value</th>
              <th className="label-micro py-2 px-4 text-right">P&L</th>
              <th className="label-micro py-2 px-4 text-right">Alloc</th>
              <th className="label-micro py-2 pl-4 text-right w-8" />
            </tr>
          </thead>
          <tbody>
            {summary.holdings.map((h) => (
              <HoldingRow key={h.id} holding={h} portfolioId={portfolioId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
