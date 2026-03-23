import type { HoldingWithPnL } from "../services/pnl-calculator";

const COLORS = [
  "#60a5fa", // blue
  "#f59e0b", // amber
  "#a78bfa", // violet
  "#f87171", // red
  "#34d399", // emerald (brighter than teal)
  "#fb923c", // orange
  "#e879f9", // fuchsia
  "#38bdf8", // sky
];

interface AllocationDonutProps {
  holdings: HoldingWithPnL[];
}

export function AllocationDonut({ holdings }: AllocationDonutProps) {
  if (holdings.length === 0) return null;

  const sorted = [...holdings].sort((a, b) => b.allocation - a.allocation);

  // Best and worst performers
  const best = [...holdings].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)[0];
  const worst = [...holdings].sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)[0];

  // SVG donut math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6">
        {/* Donut */}
        <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
          {sorted.map((h, i) => {
            const percent = h.allocation / 100;
            const dashLength = percent * circumference;
            const offset = currentOffset;
            currentOffset += dashLength;

            return (
              <circle
                key={h.id}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="10"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-offset}
                className="transition-all"
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="space-y-1">
          {sorted.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 text-[10px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="font-medium">{h.symbol}</span>
              <span className="text-muted-foreground tabular-nums">
                {h.allocation.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Best / Worst */}
      <div className="flex gap-4 text-[10px]">
        {best && (
          <div>
            <span className="text-muted-foreground">Best </span>
            <span className="font-medium">{best.symbol}</span>{" "}
            <span className="price-up tabular-nums">
              +{best.unrealizedPnLPercent.toFixed(1)}%
            </span>
          </div>
        )}
        {worst && worst.id !== best?.id && (
          <div>
            <span className="text-muted-foreground">Worst </span>
            <span className="font-medium">{worst.symbol}</span>{" "}
            <span className="price-down tabular-nums">
              {worst.unrealizedPnLPercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
