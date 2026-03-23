import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchlistView } from "@/features/watchlist/components/watchlist-view";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    }>
      <WatchlistView />
    </Suspense>
  );
}
