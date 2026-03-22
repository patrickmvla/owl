import type { Metadata } from "next";
import { MarketExplorer } from "@/features/market/components/market-explorer";

export const metadata: Metadata = {
  title: "Markets",
  description: "Explore cryptocurrency and stock markets",
};

export default function MarketPage() {
  return <MarketExplorer />;
}
