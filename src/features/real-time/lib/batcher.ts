import type { MarketUpdate } from "@/lib/types/market";
import { priceStore } from "../stores/price-store";

/** Buffer of updates waiting to be flushed */
let buffer: MarketUpdate[] = [];
let scheduled = false;

/**
 * Queue a market update for the next animation frame.
 *
 * Instead of updating the Zustand store on every WebSocket message
 * (50+ per second), updates are buffered and flushed once per frame
 * (~60 times/second). This reduces Map copies and React re-render
 * scheduling from 50/sec to ~60/sec max, with multiple updates
 * coalesced into a single batch.
 *
 * ADR-005: "The batching pattern is mandatory at 50 updates/sec"
 */
export function queueUpdate(update: MarketUpdate) {
  buffer.push(update);

  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(flush);
  }
}

function flush() {
  if (buffer.length > 0) {
    priceStore.getState().applyBatch(buffer);
    buffer = [];
  }
  scheduled = false;
}
