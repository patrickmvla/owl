import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Market overview and portfolio summary",
};

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Market overview and portfolio summary will appear here.
      </p>
    </div>
  );
}
