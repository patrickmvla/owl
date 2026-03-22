import type { Metadata } from "next";
import { GlobalStats } from "@/features/market/components/global-stats";
import { TrendingList } from "@/features/market/components/trending-list";
import { MarketTable } from "@/features/market/components/market-table";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Market overview and portfolio summary",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <GlobalStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="space-y-2">
            <span className="label-micro">Market Overview</span>
            <MarketTable limit={20} />
          </div>
        </div>
        <div>
          <TrendingList />
        </div>
      </div>
    </div>
  );
}
