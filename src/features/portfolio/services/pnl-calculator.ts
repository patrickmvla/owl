/**
 * P&L calculation for portfolio holdings.
 *
 * ADR-008 Definition of Done (Stage 4):
 * "Manually verify three P&L calculations against a spreadsheet.
 * If the numbers do not match to the cent, Stage 4 is not done."
 *
 * All arithmetic uses native JS numbers. For a display-only dashboard
 * this is acceptable — we never perform monetary transactions.
 * If we add trading, switch to integer subunit arithmetic.
 */

export interface HoldingWithPnL {
  id: string;
  symbol: string;
  assetType: "stock" | "crypto";
  quantity: number;
  avgCostBasis: number;
  currentPrice: number;
  currency: string;
  costValue: number;       // quantity × avgCostBasis
  currentValue: number;    // quantity × currentPrice
  unrealizedPnL: number;   // currentValue - costValue
  unrealizedPnLPercent: number; // (unrealizedPnL / costValue) × 100
  allocation: number;      // percentage of total portfolio value
}

export interface PortfolioSummary {
  totalCostValue: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  holdings: HoldingWithPnL[];
}

interface RawHolding {
  id: string;
  symbol: string;
  assetType: "stock" | "crypto";
  quantity: string;        // numeric from DB
  avgCostBasis: string;    // numeric from DB
  currency: string;
}

/**
 * Calculate P&L for a list of holdings given current prices.
 *
 * @param holdings - raw holdings from the database
 * @param prices - Map of symbol → current price (from Zustand store or CoinGecko)
 */
export function calculatePortfolioPnL(
  holdings: RawHolding[],
  prices: Map<string, number>,
): PortfolioSummary {
  let totalCostValue = 0;
  let totalCurrentValue = 0;

  const holdingsWithPnL: HoldingWithPnL[] = holdings.map((h) => {
    const quantity = parseFloat(h.quantity);
    const avgCostBasis = parseFloat(h.avgCostBasis);
    const currentPrice = prices.get(h.symbol) ?? 0;

    const costValue = quantity * avgCostBasis;
    const currentValue = quantity * currentPrice;
    const unrealizedPnL = currentValue - costValue;
    const unrealizedPnLPercent = costValue > 0
      ? (unrealizedPnL / costValue) * 100
      : 0;

    totalCostValue += costValue;
    totalCurrentValue += currentValue;

    return {
      id: h.id,
      symbol: h.symbol,
      assetType: h.assetType,
      quantity,
      avgCostBasis,
      currentPrice,
      currency: h.currency,
      costValue,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      allocation: 0, // calculated after totals
    };
  });

  // Calculate allocation percentages
  for (const h of holdingsWithPnL) {
    h.allocation = totalCurrentValue > 0
      ? (h.currentValue / totalCurrentValue) * 100
      : 0;
  }

  const totalUnrealizedPnL = totalCurrentValue - totalCostValue;
  const totalUnrealizedPnLPercent = totalCostValue > 0
    ? (totalUnrealizedPnL / totalCostValue) * 100
    : 0;

  return {
    totalCostValue,
    totalCurrentValue,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    holdings: holdingsWithPnL,
  };
}
