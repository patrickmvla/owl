import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketExplorer } from "@/features/market/components/market-explorer";

export const metadata: Metadata = {
  title: "Markets",
  description: "Explore cryptocurrency and stock markets",
};

export default function MarketPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-border px-6 py-3">
          <div className="h-8 w-64 animate-pulse rounded-sm bg-card" />
        </div>
        <div className="flex-1 p-6 space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
          ))}
        </div>
      </div>
    }>
      <MarketExplorer />
    </Suspense>
  );
}
