import { db } from "@/server/db";
import { portfolio, holding } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

/** Create a new portfolio for a user */
export async function createPortfolio(userId: string, name: string) {
  const [result] = await db
    .insert(portfolio)
    .values({ userId, name })
    .returning();
  return result;
}

/** Get all portfolios for a user */
export async function getPortfolios(userId: string) {
  return db
    .select()
    .from(portfolio)
    .where(eq(portfolio.userId, userId))
    .orderBy(portfolio.createdAt);
}

/** Get a single portfolio (with ownership check) */
export async function getPortfolio(userId: string, portfolioId: string) {
  const [result] = await db
    .select()
    .from(portfolio)
    .where(and(eq(portfolio.id, portfolioId), eq(portfolio.userId, userId)))
    .limit(1);
  return result;
}

/** Delete a portfolio (cascade deletes holdings) */
export async function deletePortfolio(userId: string, portfolioId: string) {
  const [result] = await db
    .delete(portfolio)
    .where(and(eq(portfolio.id, portfolioId), eq(portfolio.userId, userId)))
    .returning();
  return result;
}

/** Add a holding to a portfolio */
export async function createHolding(
  portfolioId: string,
  data: {
    symbol: string;
    asset_type: "stock" | "crypto";
    quantity: string;
    avg_cost_basis: string;
    currency: string;
  },
) {
  const [result] = await db
    .insert(holding)
    .values({
      portfolioId,
      symbol: data.symbol.toUpperCase(),
      assetType: data.asset_type,
      quantity: data.quantity,
      avgCostBasis: data.avg_cost_basis,
      currency: data.currency,
    })
    .returning();
  return result;
}

/** Get all holdings for a portfolio */
export async function getHoldings(portfolioId: string) {
  return db
    .select()
    .from(holding)
    .where(eq(holding.portfolioId, portfolioId))
    .orderBy(holding.addedAt);
}

/** Update a holding */
export async function updateHolding(
  holdingId: string,
  data: { quantity?: string | undefined; avg_cost_basis?: string | undefined },
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.quantity != null) updates.quantity = data.quantity;
  if (data.avg_cost_basis != null) updates.avgCostBasis = data.avg_cost_basis;

  const [result] = await db
    .update(holding)
    .set(updates)
    .where(eq(holding.id, holdingId))
    .returning();
  return result;
}

/** Delete a holding */
export async function deleteHolding(holdingId: string) {
  const [result] = await db
    .delete(holding)
    .where(eq(holding.id, holdingId))
    .returning();
  return result;
}
