import { db } from "@/server/db";
import { watchlist, watchlistItem } from "@/server/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getWatchlists(userId: string) {
  return db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, userId))
    .orderBy(watchlist.createdAt);
}

export async function getWatchlist(userId: string, watchlistId: string) {
  const [result] = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.id, watchlistId), eq(watchlist.userId, userId)))
    .limit(1);
  return result;
}

export async function createWatchlist(userId: string, name = "My Watchlist") {
  const [result] = await db
    .insert(watchlist)
    .values({ userId, name })
    .returning();
  return result;
}

export async function deleteWatchlist(userId: string, watchlistId: string) {
  const [result] = await db
    .delete(watchlist)
    .where(and(eq(watchlist.id, watchlistId), eq(watchlist.userId, userId)))
    .returning();
  return result;
}

export async function getWatchlistItems(watchlistId: string) {
  return db
    .select()
    .from(watchlistItem)
    .where(eq(watchlistItem.watchlistId, watchlistId))
    .orderBy(asc(watchlistItem.sortOrder));
}

export async function addWatchlistItem(
  watchlistId: string,
  data: { symbol: string; asset_type: "stock" | "crypto" },
) {
  const [result] = await db
    .insert(watchlistItem)
    .values({
      watchlistId,
      symbol: data.symbol.toUpperCase(),
      assetType: data.asset_type,
    })
    .returning();
  return result;
}

export async function removeWatchlistItem(itemId: string) {
  const [result] = await db
    .delete(watchlistItem)
    .where(eq(watchlistItem.id, itemId))
    .returning();
  return result;
}
