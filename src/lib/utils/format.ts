const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, opts?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${currency}-${JSON.stringify(opts)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...opts,
    });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/** Format a price with currency symbol. Cached formatter instances. */
export function formatPrice(
  value: number,
  currency = "USD",
  compact = false,
): string {
  if (compact) {
    return getFormatter(currency, { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }

  // Auto-adjust decimals based on value size
  if (value >= 1) {
    return getFormatter(currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  if (value >= 0.01) {
    return getFormatter(currency, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  }
  return getFormatter(currency, { minimumFractionDigits: 6, maximumFractionDigits: 8 }).format(value);
}

/** Format a percentage change */
export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Format a large number compactly (market cap, volume) */
export function formatCompact(value: number, currency = "USD"): string {
  return getFormatter(currency, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a raw number with commas */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
