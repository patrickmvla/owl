"use client";

import { useState } from "react";
import { useCorrelation } from "../hooks/use-correlation";

const TIME_RANGES = ["30", "90", "365"] as const;
const TIME_LABELS: Record<string, string> = { "30": "30D", "90": "90D", "365": "1Y" };

/** Map Binance symbol to display label */
function displaySymbol(s: string): string {
  return s.replace("USDT", "");
}

/** Color for correlation value: green = positive, red = negative, neutral = zero */
function correlationColor(r: number | null | undefined): string {
  if (r == null) return "bg-muted/30";
  const abs = Math.abs(r);
  if (abs < 0.2) return "bg-muted/30";
  if (r > 0) {
    if (abs > 0.7) return "bg-price-up/40";
    if (abs > 0.4) return "bg-price-up/25";
    return "bg-price-up/15";
  }
  if (abs > 0.7) return "bg-price-down/40";
  if (abs > 0.4) return "bg-price-down/25";
  return "bg-price-down/15";
}

function correlationTextColor(r: number | null | undefined): string {
  if (r == null) return "text-muted-foreground";
  if (Math.abs(r) < 0.2) return "text-muted-foreground";
  return r > 0 ? "price-up" : "price-down";
}

export function CorrelationMatrix() {
  const [days, setDays] = useState("90");
  const { data, isLoading } = useCorrelation(undefined, days);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-64 animate-pulse rounded-sm bg-card" />
      </div>
    );
  }

  if (!data?.symbols.length) {
    return (
      <div className="p-6 text-xs text-muted-foreground">
        No correlation data available
      </div>
    );
  }

  const { symbols, matrix } = data;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Correlation Matrix</h1>
          <span className="text-[10px] text-muted-foreground">
            {data.days}D daily returns · Pearson r
          </span>
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={`px-2.5 py-1 text-[10px] tabular-nums transition-colors ${
                days === range
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TIME_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Legend */}
        <div className="mb-4 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 bg-price-up/40" /> Strong positive
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 bg-price-up/15" /> Weak positive
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 bg-muted/30" /> No correlation
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 bg-price-down/15" /> Weak negative
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 bg-price-down/40" /> Strong negative
          </span>
        </div>

        {/* Heatmap + Summary panel */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_1fr]">

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-0 w-16" />
                {symbols.map((s) => (
                  <th
                    key={s}
                    className="label-micro p-2 text-center w-16"
                  >
                    {displaySymbol(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((rowSym) => (
                <tr key={rowSym}>
                  <td className="label-micro p-2 text-right w-16">
                    {displaySymbol(rowSym)}
                  </td>
                  {symbols.map((colSym) => {
                    const r = matrix[rowSym]?.[colSym];
                    const isSelf = rowSym === colSym;

                    return (
                      <td
                        key={colSym}
                        className={`p-0 w-16 h-12 text-center transition-colors ${
                          isSelf ? "bg-foreground/5" : correlationColor(r)
                        }`}
                      >
                        <span
                          className={`text-xs tabular-nums font-medium ${
                            isSelf ? "text-muted-foreground" : correlationTextColor(r)
                          }`}
                        >
                          {r != null ? r.toFixed(2) : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary panel (right of heatmap) */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="space-y-3 border border-border bg-card p-4">
            <span className="label-micro">Summary</span>
            {(() => {
              const validPairs = data.pairs.filter((p) => p.correlation != null);
              const avgCorr = validPairs.length > 0
                ? validPairs.reduce((sum, p) => sum + Math.abs(p.correlation!), 0) / validPairs.length
                : 0;
              const highlyCorrelated = validPairs.filter((p) => Math.abs(p.correlation!) > 0.7).length;
              const uncorrelated = validPairs.filter((p) => Math.abs(p.correlation!) < 0.2).length;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pairs analyzed</span>
                    <span className="tabular-nums font-medium">{validPairs.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg |r|</span>
                    <span className="tabular-nums font-medium">{avgCorr.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Highly correlated</span>
                    <span className="tabular-nums font-medium">{highlyCorrelated} / {validPairs.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Uncorrelated</span>
                    <span className="tabular-nums font-medium">{uncorrelated} / {validPairs.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Window</span>
                    <span className="tabular-nums font-medium">{data.days} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Data points</span>
                    <span className="tabular-nums font-medium">{validPairs[0]?.dataPoints ?? 0}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Narrative */}
          <div className="space-y-2 border border-border bg-card p-4">
            <span className="label-micro">Analysis</span>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {(() => {
                const validPairs = data.pairs.filter((p) => p.correlation != null);
                const avgCorr = validPairs.length > 0
                  ? validPairs.reduce((sum, p) => sum + Math.abs(p.correlation!), 0) / validPairs.length
                  : 0;
                const sorted = [...validPairs].sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!));
                const strongest = sorted[0];
                const weakest = sorted[sorted.length - 1];

                const lines: string[] = [];

                if (avgCorr > 0.7) {
                  lines.push(`These assets are highly correlated over ${data.days}D (avg |r| = ${avgCorr.toFixed(2)}). They tend to move together — holding multiple offers limited diversification benefit.`);
                } else if (avgCorr > 0.4) {
                  lines.push(`Moderate correlation across this group (avg |r| = ${avgCorr.toFixed(2)}). Some pairs move together while others are more independent.`);
                } else {
                  lines.push(`Low average correlation (avg |r| = ${avgCorr.toFixed(2)}). This set of assets provides good diversification — price movements are largely independent.`);
                }

                if (strongest) {
                  lines.push(`${displaySymbol(strongest.symbolA)} and ${displaySymbol(strongest.symbolB)} have the strongest relationship (r = ${strongest.correlation!.toFixed(2)}).`);
                }

                if (weakest && weakest !== strongest) {
                  lines.push(`${displaySymbol(weakest.symbolA)} and ${displaySymbol(weakest.symbolB)} are the most independent pair (r = ${weakest.correlation!.toFixed(2)}) — best for diversification.`);
                }

                return lines.map((line, i) => <p key={i} className="mb-1.5">{line}</p>);
              })()}
            </div>
          </div>
        </div>

        </div>{/* end grid */}

        {/* Ranked pairs table */}
        {data.pairs.length > 0 && (
          <div className="mt-6 space-y-2">
            <span className="label-micro">All Pairs Ranked</span>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="label-micro py-2 pr-4 text-left">Pair</th>
                    <th className="label-micro py-2 px-4 text-right">Correlation</th>
                    <th className="label-micro py-2 px-4 text-right">Strength</th>
                    <th className="label-micro py-2 px-4 text-right">Data Points</th>
                    <th className="label-micro py-2 pl-4 text-left">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.pairs]
                    .filter((p) => p.correlation != null)
                    .sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!))
                    .map((pair) => {
                      const abs = Math.abs(pair.correlation!);
                      const strength = abs > 0.7 ? "Strong" : abs > 0.4 ? "Moderate" : abs > 0.2 ? "Weak" : "None";
                      const direction = pair.correlation! > 0 ? "Positive" : "Negative";
                      const signal = abs > 0.7
                        ? pair.correlation! > 0
                          ? "Move together — limited diversification"
                          : "Move opposite — strong hedge"
                        : abs > 0.4
                          ? "Partial co-movement"
                          : "Independent — good diversification";

                      return (
                        <tr key={`${pair.symbolA}-${pair.symbolB}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">
                            {displaySymbol(pair.symbolA)} ↔ {displaySymbol(pair.symbolB)}
                          </td>
                          <td className={`py-2.5 px-4 text-right tabular-nums font-medium ${correlationTextColor(pair.correlation)}`}>
                            {pair.correlation!.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-muted-foreground">
                            {strength} {direction}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                            {pair.dataPoints}
                          </td>
                          <td className="py-2.5 pl-4 text-muted-foreground">
                            {signal}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interpretation guide */}
        <div className="mt-6 space-y-2">
          <span className="label-micro">Reading the Matrix</span>
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            <div className="bg-background px-4 py-3 space-y-1">
              <div className="text-xs font-medium price-up">r &gt; 0.7 — High Positive</div>
              <div className="text-[10px] text-muted-foreground">
                Assets move together. Holding both doubles risk in the same direction. Limited diversification benefit.
              </div>
            </div>
            <div className="bg-background px-4 py-3 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">r ≈ 0 — Uncorrelated</div>
              <div className="text-[10px] text-muted-foreground">
                Assets move independently. Best for diversification — one asset's loss doesn't predict the other.
              </div>
            </div>
            <div className="bg-background px-4 py-3 space-y-1">
              <div className="text-xs font-medium price-down">r &lt; -0.7 — High Negative</div>
              <div className="text-[10px] text-muted-foreground">
                Assets move opposite. Natural hedge — one gains when the other loses.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
