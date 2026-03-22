"use client";

import { Plus, X } from "@phosphor-icons/react";
import { useWatchlists, useCreateWatchlist, useWatchlistItems, useAddWatchlistItem, useRemoveWatchlistItem } from "../hooks/use-watchlist";
import { CoinCombobox } from "./coin-combobox";
import { PriceDisplay } from "@/ui/primitives/price-display";
import { usePrice } from "@/features/real-time/stores/price-store";
import { formatPercent } from "@/lib/utils/format";

function WatchlistItemRow({
  item,
  watchlistId,
}: {
  item: { id: string; symbol: string; assetType: string };
  watchlistId: string;
}) {
  const removeItem = useRemoveWatchlistItem(watchlistId);
  const wsSymbol = `${item.symbol}/USDT`;
  const update = usePrice(wsSymbol);
  const isPositive = (update?.change24h ?? 0) >= 0;

  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors group">
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
          onClick={() => removeItem.mutate(item.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export function WatchlistView() {
  const { data: watchlists, isLoading } = useWatchlists();
  const createWatchlist = useCreateWatchlist();

  const activeWatchlist = watchlists?.[0];

  const { data: items } = useWatchlistItems(activeWatchlist?.id ?? "");
  const addItem = useAddWatchlistItem(activeWatchlist?.id ?? "");

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

      {/* Coin search combobox */}
      <div className="border-b border-border px-4 py-2">
        <CoinCombobox
          onSelect={(coin) => {
            addItem.mutate({ symbol: coin.symbol, asset_type: "crypto" });
          }}
        />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto">
        {!items?.length ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Search and add coins to start watching
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item: any) => (
              <WatchlistItemRow key={item.id} item={item} watchlistId={activeWatchlist.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
