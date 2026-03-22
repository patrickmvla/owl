"use client";

import { useBinanceWs } from "../hooks/use-binance-ws";
import { PEG_STREAM_SYMBOLS } from "@/lib/constants/stablecoins";

/** Default symbols to stream on the dashboard */
const DEFAULT_SYMBOLS = [
  // Major crypto
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "MATIC/USDT",
  "LINK/USDT",
  "UNI/USDT",
  "ATOM/USDT",
  "LTC/USDT",
  "NEAR/USDT",
  "TRX/USDT",
  "SHIB/USDT",
  "APT/USDT",
  "ARB/USDT",
  "OP/USDT",
  // Stablecoins for peg monitoring
  ...PEG_STREAM_SYMBOLS,
];

interface MarketStreamProps {
  symbols?: string[];
  children: React.ReactNode;
}

/**
 * Initializes the Binance WebSocket connection and streams
 * price updates into the Zustand price store.
 *
 * Wrap any component tree that needs live prices with this.
 * The WS connection lives for the lifetime of this component.
 */
export function MarketStream({ symbols = DEFAULT_SYMBOLS, children }: MarketStreamProps) {
  const { status } = useBinanceWs(symbols);

  return (
    <>
      {children}
      {status !== "connected" && (
        <div className="fixed bottom-[var(--status-strip-height)] right-4 z-50 flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-md">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "connecting" ? "bg-warning animate-pulse" : "bg-destructive",
            )}
          />
          {status === "connecting" ? "Connecting to market feed..." : "Market feed disconnected"}
        </div>
      )}
    </>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
