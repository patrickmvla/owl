import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsView } from "@/features/alerts/components/alerts-view";

export const metadata: Metadata = {
  title: "Alerts",
};

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    }>
      <AlertsView />
    </Suspense>
  );
}
