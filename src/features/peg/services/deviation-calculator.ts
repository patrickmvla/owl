import type { StablecoinConfig } from "@/lib/constants/stablecoins";

export type PegStatus = "healthy" | "warning" | "critical" | "unknown";

export interface PegData {
  config: StablecoinConfig;
  price: number | null;
  deviation: number | null; // absolute percentage deviation from peg
  status: PegStatus;
}

/**
 * Calculate peg deviation for a stablecoin.
 *
 * ADR-008 Definition of Done (Stage 6):
 * "USDC at $0.9934 → deviation 0.66% → above 0.5% threshold → CRITICAL"
 * "EURC deviation is calculated against EUR, not USD"
 *
 * For USD-pegged coins, the price IS the deviation reference.
 * For EUR-pegged coins (EURC), the price on Binance is in USDT.
 * We need the EUR/USD rate to calculate the EUR peg deviation.
 * For now, we approximate: if EURC/USDT = $1.08 and EUR/USD = $1.08,
 * deviation ≈ 0%. The CoinGecko price in EUR is more accurate for this.
 *
 * Simplified for Stage 6: treat all prices as direct peg comparison.
 * EURC uses its USDT price vs an expected EUR/USD range (~1.05-1.12).
 */
export function calculateDeviation(
  price: number,
  config: StablecoinConfig,
): { deviation: number; status: PegStatus } {
  const target = config.pegTarget;
  const deviation = Math.abs((price - target) / target) * 100;

  let status: PegStatus = "healthy";
  if (deviation >= config.thresholds.critical) {
    status = "critical";
  } else if (deviation >= config.thresholds.warning) {
    status = "warning";
  }

  return { deviation, status };
}

/**
 * Get the worst peg status across all monitored stablecoins.
 * Used for the status strip indicator.
 */
export function getWorstStatus(pegs: PegData[]): PegStatus {
  if (pegs.some((p) => p.status === "critical")) return "critical";
  if (pegs.some((p) => p.status === "warning")) return "warning";
  if (pegs.every((p) => p.status === "unknown")) return "unknown";
  return "healthy";
}
