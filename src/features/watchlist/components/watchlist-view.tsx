"use client";

import { useState, useMemo } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { useWatchlists, useCreateWatchlist, useWatchlistItems, useAddWatchlistItem, useRemoveWatchlistItem } from "../hooks/use-watchlist";
import { CoinCombobox } from "./coin-combobox";
import { PriceDisplay } from "@/ui/primitives/price-display";
import { usePrice, usePriceVersion } from "@/features/real-time/stores/price-store";
import { priceStore } from "@/features/real-time/stores/price-store";
import { formatPercent } from "@/lib/utils/format";
import { PriceChart } from "@/features/market/components/price-chart";

/** Map common symbols to CoinGecko IDs for chart fetching */
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin",
  XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", AVAX: "avalanche-2",
  DOT: "polkadot", MATIC: "matic-network", LINK: "chainlink", UNI: "uniswap",
  ATOM: "cosmos", LTC: "litecoin", NEAR: "near", TRX: "tron",
  SHIB: "shiba-inu", APT: "aptos", ARB: "arbitrum", OP: "optimism",
};

function WatchlistItemRow({
  item,
  watchlistId,
  isSelected,
  onSelect,
}: {
  item: { id: string; symbol: string; assetType: string };
  watchlistId: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const removeItem = useRemoveWatchlistItem(watchlistId);
  const wsSymbol = `${item.symbol}/USDT`;
  const update = usePrice(wsSymbol);
  const isPositive = (update?.change24h ?? 0) >= 0;

  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors group ${
        isSelected ? "bg-accent/50" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium">{item.symbol}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{item.assetType}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <PriceDisplay symbol={wsSymbol} className="text-xs" />
          {update?.change24h != null && (
            <div className={`text-[10px] tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
              {formatPercent(update.change24h)}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem.mutate(item.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function WatchlistSummary({ items }: { items: any[] }) {
  const version = usePriceVersion();

  const stats = useMemo(() => {
    const store = priceStore.getState();
    let gainers = 0;
    let totalChange = 0;
    let biggestMover = { symbol: "", change: 0 };
    let counted = 0;

    for (const item of items) {
      const update = store.prices.get(`${item.symbol}/USDT`);
      if (!update?.change24h) continue;

      counted++;
      const change = update.change24h;
      if (change >= 0) gainers++;
      totalChange += change;

      if (Math.abs(change) > Math.abs(biggestMover.change)) {
        biggestMover = { symbol: item.symbol, change };
      }
    }

    return {
      gainers,
      losers: counted - gainers,
      avgChange: counted > 0 ? totalChange / counted : 0,
      biggestMover,
    };
  }, [items, version]);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-2 text-[10px] text-muted-foreground">
      <span>
        <span className="price-up">{stats.gainers} gaining</span>
        {" · "}
        <span className="price-down">{stats.losers} losing</span>
      </span>
      <span>
        avg{" "}
        <span className={stats.avgChange >= 0 ? "price-up" : "price-down"}>
          {formatPercent(stats.avgChange)}
        </span>
      </span>
      {stats.biggestMover.symbol && (
        <span>
          {stats.biggestMover.symbol}{" "}
          <span className={stats.biggestMover.change >= 0 ? "price-up" : "price-down"}>
            {formatPercent(stats.biggestMover.change)}
          </span>
          {" biggest mover"}
        </span>
      )}
    </div>
  );
}

export function WatchlistView() {
  const { data: watchlists, isLoading } = useWatchlists();
  const createWatchlist = useCreateWatchlist();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const activeWatchlist = watchlists?.[0];
  const { data: items } = useWatchlistItems(activeWatchlist?.id ?? "");
  const addItem = useAddWatchlistItem(activeWatchlist?.id ?? "");

  const selectedCoinId = selectedSymbol ? SYMBOL_TO_ID[selectedSymbol] ?? selectedSymbol.toLowerCase() : null;

  async function handleCreateWatchlist() {
    await createWatchlist.mutateAsync("My Watchlist");
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (!activeWatchlist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">No watchlist yet</p>
        <button
          onClick={handleCreateWatchlist}
          disabled={createWatchlist.isPending}
          className="flex h-8 items-center gap-2 border border-input px-4 text-xs hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
          {createWatchlist.isPending ? "Creating..." : "Create Watchlist"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-sm font-semibold">{activeWatchlist.name}</h1>
      </div>

      <div className="border-b border-border px-4 py-2">
        <CoinCombobox
          onSelect={(coin) => {
            addItem.mutate({ symbol: coin.symbol, asset_type: "crypto" });
          }}
        />
      </div>

      {items?.length ? <WatchlistSummary items={items} /> : null}

      <div className="flex-1 overflow-auto">
        {!items?.length ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Search and add coins to start watching
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/50">
              {items.map((item: any) => (
                <WatchlistItemRow
                  key={item.id}
                  item={item}
                  watchlistId={activeWatchlist.id}
                  isSelected={selectedSymbol === item.symbol}
                  onSelect={() => setSelectedSymbol(
                    selectedSymbol === item.symbol ? null : item.symbol,
                  )}
                />
              ))}
            </div>

            {/* Selected coin detail panel */}
            {selectedCoinId && (
              <div className="border-t border-border p-4 space-y-2">
                <span className="label-micro">{selectedSymbol} Chart</span>
                <PriceChart coinId={selectedCoinId} days="7" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
