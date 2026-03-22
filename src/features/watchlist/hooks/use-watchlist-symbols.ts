"use client";

import { useMemo } from "react";
import { useWatchlists, useWatchlistItems, useAddWatchlistItem, useRemoveWatchlistItem } from "./use-watchlist";

/**
 * Provides a Set of watched symbols and toggle function.
 * Used by the market table star button.
 */
export function useWatchlistSymbols() {
  const { data: watchlists } = useWatchlists();
  const activeWatchlist = watchlists?.[0];
  const watchlistId = activeWatchlist?.id ?? "";

  const { data: items } = useWatchlistItems(watchlistId);
  const addItem = useAddWatchlistItem(watchlistId);
  const removeItem = useRemoveWatchlistItem(watchlistId);

  const watchedSymbols = useMemo(() => {
    const set = new Set<string>();
    if (items) {
      for (const item of items) {
        set.add((item as any).symbol);
      }
    }
    return set;
  }, [items]);

  const itemsBySymbol = useMemo(() => {
    const map = new Map<string, string>(); // symbol → itemId
    if (items) {
      for (const item of items) {
        map.set((item as any).symbol, (item as any).id);
      }
    }
    return map;
  }, [items]);

  function toggleSymbol(symbol: string) {
    if (!watchlistId) return;

    const existing = itemsBySymbol.get(symbol.toUpperCase());
    if (existing) {
      removeItem.mutate(existing);
    } else {
      addItem.mutate({ symbol: symbol.toUpperCase(), asset_type: "crypto" });
    }
  }

  return {
    watchedSymbols,
    toggleSymbol,
    hasWatchlist: !!activeWatchlist,
  };
}
