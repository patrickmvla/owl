import { createStore, useStore } from "zustand";
import type { MarketUpdate } from "@/lib/types/market";

interface PriceState {
  /** All live prices keyed by normalized symbol */
  prices: Map<string, MarketUpdate>;

  /** Monotonic version counter — increments on every batch flush.
   *  Components select `prices.get(symbol)` and use `version` for reactivity. */
  version: number;
}

interface PriceActions {
  /** Batch-update multiple prices at once (called from RAF batcher) */
  applyBatch: (updates: MarketUpdate[]) => void;

  /** Get the current price for a symbol without subscribing */
  getPrice: (symbol: string) => MarketUpdate | undefined;
}

type PriceStore = PriceState & PriceActions;

export const priceStore = createStore<PriceStore>((set, get) => ({
  prices: new Map(),
  version: 0,

  applyBatch: (updates) => {
    const prices = get().prices;
    for (const update of updates) {
      prices.set(update.symbol, update);
    }
    // Bump version to trigger re-renders — the Map is mutated in place
    // to avoid copying 500+ entries on every tick. Components select
    // by symbol and use Object.is on the MarketUpdate reference.
    set({ version: get().version + 1 });
  },

  getPrice: (symbol) => get().prices.get(symbol),
}));

/**
 * Subscribe to a single symbol's price. Only re-renders when
 * the MarketUpdate object for THIS symbol changes — not when
 * any other symbol updates.
 *
 * This works because applyBatch mutates the Map in place and
 * replaces the MarketUpdate object only for changed symbols.
 * Object.is(oldRef, newRef) is false only for the updated symbol.
 */
export function usePrice(symbol: string): MarketUpdate | undefined {
  return useStore(priceStore, (s) => {
    // Touch version to ensure we re-evaluate when the store updates
    void s.version;
    return s.prices.get(symbol);
  });
}

/** Subscribe to the version counter (useful for components that need
 *  to know "something updated" without caring which symbol) */
export function usePriceVersion(): number {
  return useStore(priceStore, (s) => s.version);
}
