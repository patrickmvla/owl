"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { MarketTable } from "./market-table";
import { useSearch } from "../hooks/use-search";
import Link from "next/link";

export function MarketExplorer() {
  const [query, setQuery] = useState("");
  const { data: searchResults } = useSearch(query);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search coins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-8 w-full border border-input bg-transparent pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />

          {searchResults && query.length >= 2 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-64 overflow-auto border border-border bg-popover shadow-md">
              {searchResults.coins.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No results
                </div>
              ) : (
                searchResults.coins.slice(0, 8).map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/market/${coin.id}`}
                    onClick={() => setQuery("")}
                    className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                  >
                    <img
                      src={coin.thumb}
                      alt={coin.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="font-medium">{coin.name}</span>
                    <span className="text-muted-foreground uppercase">
                      {coin.symbol}
                    </span>
                    {coin.market_cap_rank && (
                      <span className="ml-auto text-muted-foreground tabular-nums">
                        #{coin.market_cap_rank}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <MarketTable limit={100} />
      </div>
    </div>
  );
}
