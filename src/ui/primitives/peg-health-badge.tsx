import type { PegStatus } from "@/features/peg/services/deviation-calculator";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<PegStatus, { label: string; dotClass: string; textClass: string }> = {
  healthy: {
    label: "HEALTHY",
    dotClass: "bg-price-up",
    textClass: "text-price-up",
  },
  warning: {
    label: "WARNING",
    dotClass: "bg-warning animate-pulse",
    textClass: "text-warning",
  },
  critical: {
    label: "CRITICAL",
    dotClass: "bg-destructive animate-pulse",
    textClass: "text-destructive",
  },
  unknown: {
    label: "NO DATA",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
  },
};

interface PegHealthBadgeProps {
  status: PegStatus;
  className?: string;
}

export function PegHealthBadge({ status, className }: PegHealthBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      <span className={cn("text-[10px] font-medium uppercase tracking-widest", config.textClass)}>
        {config.label}
      </span>
    </span>
  );
}
