import type { Metadata } from "next";
import { WatchlistView } from "@/features/watchlist/components/watchlist-view";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return <WatchlistView />;
}
