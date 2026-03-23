import type { Metadata } from "next";
import { Suspense } from "react";
import { CorrelationMatrix } from "@/features/correlation/components/correlation-matrix";

export const metadata: Metadata = {
  title: "Correlation",
  description: "Cross-asset correlation analysis",
};

export default function CorrelationPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-64 animate-pulse rounded-sm bg-card" />
      </div>
    }>
      <CorrelationMatrix />
    </Suspense>
  );
}
