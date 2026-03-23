import type { Metadata } from "next";
import { Suspense } from "react";
import { SettlementOptimizer } from "@/features/settlement/components/settlement-optimizer";

export const metadata: Metadata = {
  title: "Settlement",
  description: "Find the best path to convert fiat to stablecoins",
};

export default function SettlementPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-24 animate-pulse rounded-sm bg-card" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-sm bg-card" />
          ))}
        </div>
      </div>
    }>
      <SettlementOptimizer />
    </Suspense>
  );
}
