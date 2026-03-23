import type { Metadata } from "next";
import { Suspense } from "react";
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

/** Skeleton primitives for Suspense fallbacks */
function CardSkeleton() {
  return <div className="h-20 animate-pulse rounded-sm bg-card" />;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="h-20 animate-pulse rounded-sm bg-card" />
      <div className="h-20 animate-pulse rounded-sm bg-card" />
      <div className="h-20 animate-pulse rounded-sm bg-card" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-6">
      {/* Row 1: Personal command bar — each card streams independently */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CardSkeleton />}>
          <PortfolioSnapshot />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <WatchlistMoversMini />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <PegStatusMini />
        </Suspense>
      </div>

      {/* Row 2: Market context + alerts */}
      <Suspense fallback={<StatsSkeleton />}>
        <GlobalStats />
      </Suspense>
      <Suspense fallback={null}>
        <AlertsFiredBanner />
      </Suspense>

      {/* Row 3: Main content + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <Suspense fallback={<TableSkeleton />}>
            <MarketMoversPanel />
          </Suspense>
          <div className="space-y-2">
            {/* This label renders instantly — it's just HTML in a Server Component */}
            <span className="label-micro">All Markets</span>
            <Suspense fallback={<TableSkeleton />}>
              <MarketTable limit={20} />
            </Suspense>
          </div>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<TableSkeleton />}>
            <TrendingList />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <CurrencyConverter />
          </Suspense>
          {/* Static text — renders instantly, zero JS */}
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
