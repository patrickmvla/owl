"use client";

import Link from "next/link";
import { usePegMonitor } from "../hooks/use-peg-monitor";
import { useMounted } from "@/lib/hooks/use-mounted";

export function PegStatusMini() {
  const mounted = useMounted();
  const { pegs, worstStatus } = usePegMonitor();

  if (!mounted) {
    return <div className="h-20 animate-pulse rounded-sm bg-card" />;
  }

  const borderClass =
    worstStatus === "critical"
      ? "border-l-destructive"
      : worstStatus === "warning"
        ? "border-l-warning"
        : "border-l-transparent";

  return (
    <Link
      href="/peg"
      className={`flex flex-col justify-center rounded-sm border border-border/50 bg-card px-4 h-20 hover:bg-muted/50 transition-colors border-l-2 ${borderClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="label-micro">Peg Status</span>
        <span className={`text-[10px] uppercase tracking-widest font-medium ${
          worstStatus === "critical" ? "text-destructive" :
          worstStatus === "warning" ? "text-warning" :
          worstStatus === "healthy" ? "price-up" :
          "text-muted-foreground"
        }`}>
          {worstStatus === "unknown" ? "loading" : worstStatus}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {pegs.map((peg) => (
          <span key={peg.config.symbol} className="flex items-center gap-1 text-[10px]">
            <span className={`h-1 w-1 rounded-full ${
              peg.status === "critical" ? "bg-destructive animate-pulse" :
              peg.status === "warning" ? "bg-warning animate-pulse" :
              peg.status === "healthy" ? "bg-price-up" :
              "bg-muted-foreground"
            }`} />
            <span className="text-muted-foreground">{peg.config.symbol}</span>
          </span>
        ))}
      </div>
    </Link>
  );
}
