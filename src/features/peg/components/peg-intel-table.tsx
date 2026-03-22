"use client";

import { useMemo } from "react";
import { usePegMonitor } from "../hooks/use-peg-monitor";
import { usePegHistory } from "../hooks/use-peg-history";
import { PegHealthBadge } from "@/ui/primitives/peg-health-badge";
import { STABLECOINS, type RiskGrade } from "@/lib/constants/stablecoins";
import { Tooltip } from "radix-ui";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-price-up", "A": "text-price-up", "A-": "text-price-up",
  "B+": "text-foreground", "B": "text-foreground", "B-": "text-muted-foreground",
  "C+": "text-warning", "C": "text-warning", "C-": "text-warning",
  "D": "text-destructive", "F": "text-destructive",
};

export function PegIntelTable() {
  const { pegs } = usePegMonitor();
  const { data: history } = usePegHistory("7");

  const intel = useMemo(() => {
    return pegs.map((peg, i) => {
      const config = peg.config;
      const historyData = history?.find((h) => h.symbol === config.symbol);

      // 7D depeg events: count points where |deviation| > warning threshold
      let depegEvents = 0;
      let minPrice = peg.price ?? 0;
      let maxPrice = peg.price ?? 0;

      if (historyData?.points.length) {
        for (const p of historyData.points) {
          if (Math.abs(p.value) >= config.thresholds.warning) {
            depegEvents++;
          }
        }
        // Approximate 24h range from last ~24 points (hourly data for 7D)
        const last24 = historyData.points.slice(-24);
        if (last24.length > 0) {
          const prices24 = last24.map((p) => config.pegTarget * (1 + p.value / 100));
          minPrice = Math.min(...prices24);
          maxPrice = Math.max(...prices24);
        }
      }

      return {
        ...peg,
        depegEvents,
        minPrice,
        maxPrice,
      };
    });
  }, [pegs, history]);

  return (
    <div className="space-y-2">
      <span className="label-micro">Market Intelligence</span>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="label-micro py-2 pr-4 text-left">Symbol</th>
              <th className="label-micro py-2 px-3 text-right">Deviation</th>
              <th className="label-micro py-2 px-3 text-right">24h Range</th>
              <th className="label-micro py-2 px-3 text-right">7d Events</th>
              <th className="label-micro py-2 px-3 text-right">Grade</th>
              <th className="label-micro py-2 pl-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {intel.map((row) => (
              <tr key={row.config.symbol} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{row.config.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">
                      vs {row.config.pegCurrency === "EUR" ? "€" : "$"}
                    </span>
                  </div>
                </td>
                <td className={`py-2.5 px-3 text-right tabular-nums ${
                  row.status === "critical" ? "text-destructive" :
                  row.status === "warning" ? "text-warning" :
                  "text-muted-foreground"
                }`}>
                  {row.deviation != null ? `${row.deviation.toFixed(3)}%` : "—"}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {row.minPrice > 0
                    ? `${row.minPrice.toFixed(4)}–${row.maxPrice.toFixed(4)}`
                    : "—"}
                </td>
                <td className={`py-2.5 px-3 text-right tabular-nums ${
                  row.depegEvents > 0 ? "text-warning" : "text-muted-foreground"
                }`}>
                  {row.depegEvents}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Tooltip.Provider delayDuration={200}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <span className={`font-semibold cursor-default ${GRADE_COLORS[row.config.riskGrade] ?? "text-muted-foreground"}`}>
                          {row.config.riskGrade}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="left"
                          sideOffset={8}
                          className="z-50 max-w-[200px] rounded-sm bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md border border-border"
                        >
                          {row.config.riskNote}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </td>
                <td className="py-2.5 pl-3">
                  <PegHealthBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
