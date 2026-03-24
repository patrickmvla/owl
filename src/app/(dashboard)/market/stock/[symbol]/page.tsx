import { Suspense } from "react";
import { StockDetail } from "@/features/market/components/stock-detail";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-[400px] animate-pulse rounded-sm bg-card" />
      </div>
    }>
      <StockDetail symbol={symbol.toUpperCase()} />
    </Suspense>
  );
}
