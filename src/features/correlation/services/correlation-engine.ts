/**
 * Pearson correlation coefficient computation.
 *
 * ADR-008 Definition of Done (Stage 7):
 * "Perfect positive correlation: two identical series → r = 1.0"
 * "Perfect negative correlation: two inverse series → r = -1.0"
 * "Zero correlation: random series → r ≈ 0"
 * "Insufficient data: < 2 overlapping points → returns null"
 */

/**
 * Compute Pearson r between two arrays of equal length.
 * Returns null if insufficient data.
 */
export function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i]!;
    const yi = y[i]!;
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return null;

  return numerator / denominator;
}

/**
 * Convert price series to daily returns (percentage change).
 * Correlation on returns is more meaningful than on raw prices.
 */
export function toReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    const curr = prices[i]!;
    if (prev === 0) {
      returns.push(0);
    } else {
      returns.push((curr - prev) / prev);
    }
  }
  return returns;
}

export interface CorrelationPair {
  symbolA: string;
  symbolB: string;
  correlation: number | null;
  dataPoints: number;
}

/**
 * Compute correlation matrix for a list of symbols.
 * Each symbol's data is an array of daily close prices (same length, aligned by date).
 */
export function computeCorrelationMatrix(
  symbols: string[],
  priceData: Map<string, number[]>,
): CorrelationPair[] {
  const results: CorrelationPair[] = [];

  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const symA = symbols[i]!;
      const symB = symbols[j]!;
      const pricesA = priceData.get(symA);
      const pricesB = priceData.get(symB);

      if (!pricesA || !pricesB) {
        results.push({ symbolA: symA, symbolB: symB, correlation: null, dataPoints: 0 });
        continue;
      }

      // Align to same length (shortest)
      const len = Math.min(pricesA.length, pricesB.length);
      const returnsA = toReturns(pricesA.slice(-len));
      const returnsB = toReturns(pricesB.slice(-len));

      const r = pearsonCorrelation(returnsA, returnsB);

      results.push({
        symbolA: symA,
        symbolB: symB,
        correlation: r,
        dataPoints: returnsA.length,
      });
    }
  }

  return results;
}
