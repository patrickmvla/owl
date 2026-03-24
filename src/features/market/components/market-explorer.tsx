"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { MarketTable } from "./market-table";
import { MarketMoversPanel } from "./market-movers";
import { useSearch } from "../hooks/use-search";
import { useStockSearch } from "../hooks/use-stock-quote";
import { useMarketOverview } from "../hooks/use-market-overview";
import { formatCompact, formatPercent } from "@/lib/utils/format";
import Link from "next/link";

export function MarketExplorer() {
  const [query, setQuery] = useState("");
  const { data: searchResults } = useSearch(query);
  const { data: stockResults } = useStockSearch(query.length >= 2 ? query : "");
  const { data: overview } = useMarketOverview();

  const global = overview?.global;

  return (
    <div className="flex h-full flex-col">
      {/* Header with search + stats */}
      <div className="border-b border-border px-6 py-3 space-y-3">
        <div className="flex items-center gap-6">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search coins or stocks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-8 w-full border border-input bg-transparent pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />

            {query.length >= 2 && (searchResults || stockResults) && (
              <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-72 overflow-auto border border-border bg-popover shadow-md">
                {/* Crypto results */}
                {searchResults?.coins?.length ? (
                  <>
                    <div className="px-3 py-1 label-micro border-b border-border/50">Crypto</div>
                    {searchResults.coins.slice(0, 5).map((coin) => (
                      <Link
                        key={coin.id}
                        href={`/market/${coin.id}`}
                        onClick={() => setQuery("")}
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        <img src={coin.thumb} alt={coin.name} width={16} height={16} className="rounded-full" />
                        <span className="font-medium">{coin.name}</span>
                        <span className="text-muted-foreground uppercase">{coin.symbol}</span>
                        {coin.market_cap_rank && (
                          <span className="ml-auto text-muted-foreground tabular-nums">#{coin.market_cap_rank}</span>
                        )}
                      </Link>
                    ))}
                  </>
                ) : null}

                {/* Stock results */}
                {stockResults?.result?.length ? (
                  <>
                    <div className="px-3 py-1 label-micro border-b border-border/50">Stocks</div>
                    {stockResults.result.slice(0, 5).map((stock, i) => (
                      <Link
                        key={`${stock.symbol}-${i}`}
                        href={`/market/stock/${stock.symbol}`}
                        onClick={() => setQuery("")}
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{stock.displaySymbol}</span>
                        <span className="text-muted-foreground truncate">{stock.description}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{stock.type}</span>
                      </Link>
                    ))}
                  </>
                ) : null}

                {!searchResults?.coins?.length && !stockResults?.result?.length && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No results</div>
                )}
              </div>
            )}
          </div>

          {/* Inline market stats */}
          {global && (
            <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>
                <span className="label-micro mr-1">Cap</span>
                <span className="tabular-nums">{formatCompact(global.total_market_cap?.usd ?? 0)}</span>
              </span>
              <span>
                <span className="label-micro mr-1">Vol</span>
                <span className="tabular-nums">{formatCompact(global.total_volume?.usd ?? 0)}</span>
              </span>
              <span>
                <span className="label-micro mr-1">BTC</span>
                <span className="tabular-nums">{(global.market_cap_percentage?.btc ?? 0).toFixed(1)}%</span>
              </span>
              <span className={`tabular-nums ${(global.market_cap_change_percentage_24h_usd ?? 0) >= 0 ? "price-up" : "price-down"}`}>
                {formatPercent(global.market_cap_change_percentage_24h_usd ?? 0)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Market movers */}
        <div className="px-6 py-4">
          <MarketMoversPanel />
        </div>

        {/* Full table */}
        <div className="px-6 pb-6 space-y-2">
          <span className="label-micro">All Markets</span>
          <MarketTable limit={100} />
        </div>
      </div>
    </div>
  );
}
