"use client";

import { usePegMonitor } from "../hooks/use-peg-monitor";
import { PegHealthBadge } from "@/ui/primitives/peg-health-badge";
import { formatPrice } from "@/lib/utils/format";
import { DeviationChart } from "./deviation-chart";
import { PegIntelTable } from "./peg-intel-table";
import type { PegData } from "../services/deviation-calculator";

function PegCard({ peg }: { peg: PegData }) {
  const deviationText = peg.deviation != null ? `${peg.deviation.toFixed(3)}%` : "—";
  const priceText = peg.price != null ? formatPrice(peg.price) : "—";
  const isDepegged = peg.deviation != null && peg.deviation >= peg.config.thresholds.warning;

  return (
    <div className="space-y-2 border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{peg.config.symbol}</span>
          <span className="text-[10px] text-muted-foreground">
            vs {peg.config.pegCurrency === "EUR" ? "€" : "$"}{peg.config.pegTarget.toFixed(2)}
          </span>
        </div>
        <PegHealthBadge status={peg.status} />
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-lg font-semibold tabular-nums">{priceText}</span>
        <span
          className={`text-xs tabular-nums ${
            isDepegged ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {peg.deviation != null ? `${peg.deviation >= 0 ? "+" : ""}${deviationText} deviation` : "No data"}
        </span>
      </div>

      {/* Threshold indicators */}
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        <span>Warn: {peg.config.thresholds.warning}%</span>
        <span>Crit: {peg.config.thresholds.critical}%</span>
      </div>
    </div>
  );
}

export function PegDashboard() {
  const { pegs, worstStatus } = usePegMonitor();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Peg Monitor</h1>
          <PegHealthBadge status={worstStatus} />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {pegs.filter((p) => p.price != null).length} of {pegs.length} coins tracked
        </span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Worst deviation callout */}
        {worstStatus !== "healthy" && worstStatus !== "unknown" && (
          <div className={`mb-4 border px-4 py-3 text-xs ${
            worstStatus === "critical"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-warning/50 bg-warning/10 text-warning"
          }`}>
            {(() => {
              const worst = [...pegs]
                .filter((p) => p.deviation != null)
                .sort((a, b) => (b.deviation ?? 0) - (a.deviation ?? 0))[0];
              if (!worst) return null;
              return `${worst.config.symbol} is ${worst.deviation?.toFixed(3)}% off peg — ${worst.status.toUpperCase()}`;
            })()}
          </div>
        )}

        {/* Stablecoin cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pegs.map((peg) => (
            <PegCard key={peg.config.symbol} peg={peg} />
          ))}
        </div>

        {/* Section A: Deviation history chart */}
        <div className="mt-6">
          <DeviationChart />
        </div>

        {/* Section B: Market intelligence table */}
        <div className="mt-6">
          <PegIntelTable />
        </div>
      </div>
    </div>
  );
}
