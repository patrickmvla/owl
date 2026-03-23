"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, Lightning, ShieldCheck, CaretDown, WarningCircle } from "@phosphor-icons/react";
import { useSettlementPaths, type SettlementResult } from "../hooks/use-settlement";
import { useExchangeRates } from "@/features/market/hooks/use-exchange-rates";
import { CURRENCIES } from "@/lib/constants/currencies";
import { formatPrice, formatNumber } from "@/lib/utils/format";
import { Tooltip } from "radix-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { ScrollArea } from "@/ui/components/scroll-area";
import type { SettlementPath } from "../services/path-calculator";

const GRADE_COLORS: Record<string, string> = {
  "A+": "price-up", "A": "price-up", "A-": "price-up",
  "B+": "text-foreground", "B": "text-foreground", "B-": "text-muted-foreground",
  "C+": "text-warning", "C": "text-warning",
  "D": "text-destructive", "F": "text-destructive",
};

// ============================================
// Currency Picker
// ============================================

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const info = CURRENCIES.find((c) => c.code === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors shrink-0">
          {info?.symbol} {info?.code}
          <CaretDown size={12} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0">
        <ScrollArea className="h-64">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange} className="p-1">
            {CURRENCIES.map((c) => (
              <DropdownMenuRadioItem key={c.code} value={c.code} className="text-xs">
                {c.symbol} {c.code} — {c.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Live Countdown Hook
// ============================================

function useCountdown(timestamp: number | undefined) {
  const [age, setAge] = useState(0);

  useEffect(() => {
    if (!timestamp) return;

    const update = () => setAge(Math.floor((Date.now() - timestamp) / 1000));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const remaining = Math.max(0, 60 - age);
  const staleLevel = age < 30 ? "fresh" : age < 50 ? "aging" : "stale";

  return { age, remaining, staleLevel };
}

// ============================================
// Winner Card
// ============================================

function WinnerCard({ path, fromCurrency, flash }: { path: SettlementPath; fromCurrency: string; flash: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (flash && cardRef.current) {
      cardRef.current.classList.remove("flash-up");
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add("flash-up");
    }
  }, [flash]);

  return (
    <div ref={cardRef} className="border-l-2 border-l-price-up bg-card p-4 space-y-3" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{path.stablecoin} on {path.chain.shortName}</span>
          {path.chain.isPrimary && (
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground border border-border px-1">primary</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest price-up font-medium">
          <Lightning size={10} weight="fill" />
          best
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="label-micro">You receive</span>
          <div className="text-xl font-semibold tabular-nums mt-0.5">
            {formatNumber(path.netAmount, 2)} <span className="text-sm text-muted-foreground">{path.stablecoin}</span>
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            ≈ {formatPrice(path.netValueUsd)}
          </div>
        </div>
        <div>
          <span className="label-micro">You give up</span>
          <div className="text-sm tabular-nums price-down mt-0.5">
            −{formatPrice(path.lossUsd ?? 0)} <span className="text-[10px]">({(path.lossPercent ?? 0).toFixed(2)}%)</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Gas: {formatPrice(path.gasFeeUsd)} · {path.chain.type}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span className="flex items-center gap-1 cursor-default">
                <ShieldCheck size={12} />
                Peg risk: <span className={GRADE_COLORS[path.riskGrade] ?? "text-muted-foreground"}>{path.riskGrade}</span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="top" className="z-50 max-w-[200px] rounded-sm bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md border border-border">
                {path.riskNote}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <span>Rate: {path.rate.toFixed(4)}</span>
      </div>
    </div>
  );
}

// ============================================
// Paths Table with Interactive Filters
// ============================================

function PathsTable({
  paths,
  filter,
  onFilterChange,
}: {
  paths: SettlementPath[];
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  const filtered = filter === "all" ? paths : paths.filter((p) => p.stablecoin === filter);
  const stablecoins = [...new Set(paths.map((p) => p.stablecoin))];
  const worst = filtered[filtered.length - 1];
  const best = filtered[0];

  return (
    <div className="space-y-2">
      {/* Interactive filter tabs */}
      <div className="flex items-center gap-1 px-4" role="tablist" aria-label="Filter by stablecoin">
        {["all", ...stablecoins].map((f) => {
          const count = f === "all" ? paths.length : paths.filter((p) => p.stablecoin === f).length;
          const isActive = filter === f;
          return (
            <button
              key={f}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(f)}
              className={`cursor-pointer px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? `All (${count})` : `${f} (${count})`}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="label-micro py-2 pl-4 pr-2 text-left w-6">#</th>
              <th className="label-micro py-2 pr-4 text-left">Asset · Chain</th>
              <th className="label-micro py-2 px-3 text-right">You receive</th>
              <th className="label-micro py-2 px-3 text-right">Loss</th>
              <th className="label-micro py-2 px-3 text-right">Gas</th>
              <th className="label-micro py-2 px-3 text-right hidden sm:table-cell">Grade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((path) => (
              <tr
                key={`${path.chain.id}-${path.stablecoin}`}
                className={`border-b border-border/50 transition-colors ${
                  path.isRecommended ? "bg-price-up-muted/20" : "hover:bg-muted/50"
                }`}
              >
                <td className="py-2.5 pl-4 pr-2 text-muted-foreground tabular-nums">
                  {path.isRecommended ? <Lightning size={12} weight="fill" className="text-price-up" /> : path.rank}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="font-medium">{path.stablecoin}</span>
                  <span className="text-muted-foreground"> · {path.chain.shortName}</span>
                  {path.chain.isPrimary && <span className="text-[8px] ml-1 text-muted-foreground">★</span>}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatNumber(path.netAmount, 2)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums price-down">
                  −{formatPrice(path.lossUsd ?? 0)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {formatPrice(path.gasFeeUsd)}
                </td>
                <td className={`py-2.5 px-3 text-right font-medium hidden sm:table-cell ${GRADE_COLORS[path.riskGrade] ?? "text-muted-foreground"}`}>
                  {path.riskGrade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Savings callout */}
      {best && worst && best !== worst && worst.netValueUsd > 0 && (
        <div className="px-4 text-[10px] text-muted-foreground">
          Choosing {worst.stablecoin} on {worst.chain.shortName} instead of {best.stablecoin} on {best.chain.shortName} costs you{" "}
          <span className="price-down font-medium">{formatPrice(best.netValueUsd - worst.netValueUsd)} more</span>.
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function SettlementOptimizer() {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [stablecoinFilter, setStablecoinFilter] = useState("all");
  const { data: exchangeRates, isError: ratesError } = useExchangeRates();
  const prevRecommendedRef = useRef<string | null>(null);
  const [flashWinner, setFlashWinner] = useState(false);

  // Convert source currency → USD
  const amountUsd = useMemo(() => {
    const raw = parseFloat(amount);
    if (isNaN(raw) || raw <= 0) return 0;
    if (fromCurrency === "USD") return raw;
    if (!exchangeRates) return 0;
    const fromRate = exchangeRates[fromCurrency.toLowerCase()];
    const usdRate = exchangeRates["usd"];
    if (!fromRate || !usdRate) return 0;
    return raw * (usdRate.value / fromRate.value);
  }, [amount, fromCurrency, exchangeRates]);

  const { data, isLoading, isFetching, error } = useSettlementPaths(
    amountUsd > 0 ? amountUsd.toString() : "",
  );

  const recommended = data?.paths.find((p) => p.isRecommended);
  const fromInfo = CURRENCIES.find((c) => c.code === fromCurrency);
  const { age, remaining, staleLevel } = useCountdown(data?.timestamp);

  // Detect recommended path change → trigger flash
  useEffect(() => {
    if (!recommended) return;
    const key = `${recommended.stablecoin}-${recommended.chain.id}`;
    if (prevRecommendedRef.current && prevRecommendedRef.current !== key) {
      setFlashWinner(true);
      setTimeout(() => setFlashWinner(false), 300);
    }
    prevRecommendedRef.current = key;
  }, [recommended]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with live countdown */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Settlement Optimizer</h1>
          <div className="flex items-center gap-2">
            {/* Gas source with tooltip */}
            {data && (
              <Tooltip.Provider delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <span className="text-[10px] text-muted-foreground cursor-default">
                      {data.gasDataSource}
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom" className="z-50 rounded-sm bg-popover px-3 py-2 text-[10px] text-popover-foreground shadow-md border border-border">
                      <div className="space-y-1">
                        {data.gasDetail.map((g) => (
                          <div key={g.chain} className="flex justify-between gap-4">
                            <span className="capitalize">{g.chain}</span>
                            <span className={g.source === "live" ? "price-up" : "text-muted-foreground"}>
                              {g.source} · {formatPrice(g.usd)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}

            {/* Live countdown */}
            {data && (
              <span className={`text-[10px] tabular-nums ${
                staleLevel === "fresh" ? "text-muted-foreground" :
                staleLevel === "aging" ? "text-muted-foreground" :
                "text-warning"
              }`}>
                {age}s ago · {remaining}s
              </span>
            )}

            {/* Background refetch indicator */}
            {isFetching && !isLoading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">Updating...</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Conversion panel — Wise-style */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center max-w-lg">
            <div className="flex items-center border border-border flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent px-4 py-2.5 text-lg tabular-nums font-semibold placeholder:text-muted-foreground focus:outline-none"
                placeholder="Enter amount"
              />
              <div className="h-6 w-px bg-border" />
              <CurrencyPicker value={fromCurrency} onChange={setFromCurrency} />
            </div>

            <ArrowRight size={16} className="text-muted-foreground shrink-0 hidden sm:block" />

            <div className="text-sm text-muted-foreground shrink-0">Stablecoins</div>
          </div>

          {/* Currency conversion rate */}
          {fromCurrency !== "USD" && amountUsd > 0 && (
            <div className="text-[10px] text-muted-foreground mt-2 tabular-nums">
              {fromInfo?.symbol}{amount} {fromCurrency} ≈ {formatPrice(amountUsd)} USD
            </div>
          )}

          {/* Exchange rate error */}
          {ratesError && fromCurrency !== "USD" && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-warning">
              <WarningCircle size={12} />
              Currency conversion unavailable — showing USD only
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-lg">
            Compare the best way to convert {fromCurrency} to stablecoins across 6 blockchains.
            Rates and gas fees refresh every 60 seconds from live public sources.
          </p>
        </div>

        {/* Results */}
        {!amount || amountUsd <= 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-xs text-muted-foreground">Enter an amount to compare settlement paths</div>
            <div className="text-[10px] text-muted-foreground/60">
              Works with {CURRENCIES.length} currencies including ZMW, NGN, EUR
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <WarningCircle size={24} className="text-destructive mx-auto" />
            <div className="text-xs text-destructive">Failed to calculate settlement paths</div>
            <div className="text-[10px] text-muted-foreground">{(error as Error).message}</div>
          </div>
        ) : isLoading ? (
          <div className="p-6 space-y-3">
            <div className="h-24 animate-pulse rounded-sm bg-card" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
            ))}
          </div>
        ) : data?.paths.length ? (
          <div className={`space-y-4 py-4 transition-opacity ${isFetching && !isLoading ? "opacity-70" : ""}`}>
            {/* Winner card */}
            {recommended && (
              <div className="px-6">
                <WinnerCard
                  path={recommended}
                  fromCurrency={fromCurrency}
                  flash={flashWinner}
                />
              </div>
            )}

            {/* Paths table with interactive filters */}
            <PathsTable
              paths={data.paths}
              filter={stablecoinFilter}
              onFilterChange={setStablecoinFilter}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
