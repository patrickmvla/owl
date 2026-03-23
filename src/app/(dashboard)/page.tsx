import type { Metadata } from "next";
import { GlobalStats } from "@/features/market/components/global-stats";
import { MarketMoversPanel } from "@/features/market/components/market-movers";
import { MarketTable } from "@/features/market/components/market-table";
import { TrendingList } from "@/features/market/components/trending-list";
import { CurrencyConverter } from "@/features/market/components/currency-converter";
import { PortfolioSnapshot } from "@/features/portfolio/components/portfolio-snapshot";
import { WatchlistMoversMini } from "@/features/watchlist/components/watchlist-movers-mini";
import { PegStatusMini } from "@/features/peg/components/peg-status-mini";
import { AlertsFiredBanner } from "@/features/alerts/components/alerts-fired-banner";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Market overview and portfolio summary",
};

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-6">
      {/* Row 1: Personal command bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PortfolioSnapshot />
        <WatchlistMoversMini />
        <PegStatusMini />
      </div>

      {/* Row 2: Market context + alerts */}
      <GlobalStats />
      <AlertsFiredBanner />

      {/* Row 3: Main content + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <MarketMoversPanel />
          <div className="space-y-2">
            <span className="label-micro">All Markets</span>
            <MarketTable limit={20} />
          </div>
        </div>
        <div className="space-y-6">
          <TrendingList />
          <CurrencyConverter />
          <p className="text-[10px] leading-relaxed text-muted-foreground/60 px-2">
            Check live exchange rates across 60+ currencies. Built for freelancers
            and remote workers receiving international payments in USD/EUR and
            settling to local currency or stablecoins.
          </p>
        </div>
      </div>
    </div>
  );
}
