"use client";

import { useState } from "react";
import { PriceChart } from "./price-chart";

const TIME_RANGES = ["1", "7", "30", "90", "365"] as const;
const TIME_LABELS: Record<string, string> = {
  "1": "1D",
  "7": "1W",
  "30": "1M",
  "90": "3M",
  "365": "1Y",
};

/**
 * Client Component — manages time range state and renders Lightweight Charts.
 * Only the chart needs client-side JS.
 */
export function CoinDetailChart({ coinId }: { coinId: string }) {
  const [days, setDays] = useState("30");

  return (
    <div className="px-6 pt-4">
      <div className="flex gap-1 mb-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setDays(range)}
            className={`px-2.5 py-1 text-xs tabular-nums transition-colors ${
              days === range
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TIME_LABELS[range]}
          </button>
        ))}
      </div>
      <PriceChart coinId={coinId} days={days} />
    </div>
  );
}
