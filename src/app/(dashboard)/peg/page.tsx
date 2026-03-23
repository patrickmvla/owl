import type { Metadata } from "next";
import { Suspense } from "react";
import { PegDashboard } from "@/features/peg/components/peg-dashboard";

export const metadata: Metadata = {
  title: "Peg Monitor",
  description: "Track stablecoin peg deviations in real-time",
};

export default function PegPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-sm bg-card" />
          ))}
        </div>
      </div>
    }>
      <PegDashboard />
    </Suspense>
  );
}
