"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react";
import { useAlertRules } from "../hooks/use-alerts";
import { formatPrice } from "@/lib/utils/format";

const CONDITION_LABELS: Record<string, string> = {
  price_above: "crossed above",
  price_below: "dropped below",
  peg_deviation: "peg deviation exceeded",
};

export function AlertsFiredBanner() {
  const { data: rules } = useAlertRules();

  const recentlyFired = useMemo(() => {
    if (!rules?.length) return [];

    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return rules
      .filter((r: any) => r.lastTriggeredAt && new Date(r.lastTriggeredAt).getTime() > dayAgo)
      .sort((a: any, b: any) =>
        new Date(b.lastTriggeredAt).getTime() - new Date(a.lastTriggeredAt).getTime(),
      )
      .slice(0, 3);
  }, [rules]);

  if (recentlyFired.length === 0) return null;

  return (
    <Link
      href="/alerts"
      className="flex items-center gap-3 rounded-sm border border-warning/30 bg-warning/5 px-4 py-2 hover:bg-warning/10 transition-colors"
    >
      <Lightning size={14} weight="fill" className="text-warning shrink-0" />
      <div className="flex-1 text-xs text-muted-foreground">
        {recentlyFired.map((r: any, i: number) => {
          const ago = Date.now() - new Date(r.lastTriggeredAt).getTime();
          const hours = Math.floor(ago / 3600000);
          const label = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : "";

          return (
            <span key={r.id}>
              {i > 0 && " · "}
              <span className="font-medium text-foreground">{r.symbol}</span>{" "}
              {CONDITION_LABELS[r.condition] ?? r.condition}{" "}
              <span className="tabular-nums">
                {r.condition === "peg_deviation" ? `${r.threshold}%` : formatPrice(parseFloat(r.threshold))}
              </span>
              {label && <span className="text-muted-foreground/60"> {label}</span>}
            </span>
          );
        })}
      </div>
    </Link>
  );
}
