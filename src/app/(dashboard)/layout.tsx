import { IconRail } from "@/ui/components/icon-rail";
import { StatusStrip } from "@/ui/primitives/status-strip";
import { MarketStream } from "@/features/real-time/components/market-stream";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <IconRail />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MarketStream>
          <main className="flex-1 overflow-auto">{children}</main>
        </MarketStream>
        <StatusStrip />
      </div>
    </div>
  );
}
