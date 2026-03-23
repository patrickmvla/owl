import type { Metadata } from "next";
import { Suspense } from "react";
import { PortfolioView } from "@/features/portfolio/components/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track your holdings and P&L",
};

export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-64 animate-pulse rounded-sm bg-card" />
      </div>
    }>
      <PortfolioView />
    </Suspense>
  );
}
