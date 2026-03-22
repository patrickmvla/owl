interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * In-memory TTL cache.
 *
 * On Vercel serverless, this persists within a warm function instance
 * (~5-15 minutes typically). Cold starts get an empty cache — acceptable
 * because CoinGecko data freshness is 60s anyway.
 *
 * This is NOT a distributed cache. Multiple function instances have
 * independent caches. This means worst-case we hit CoinGecko once per
 * warm instance per TTL window. At low traffic this is fine.
 *
 * Upgrade path: Vercel KV or Upstash Redis when cache miss rate
 * threatens the 10K/month CoinGecko budget.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && now < existing.expiresAt) {
    return existing.data;
  }

  const data = await fetcher();

  store.set(key, { data, expiresAt: now + ttlMs });

  return data;
}

/** Cache TTLs from ADR-002 */
export const TTL = {
  COIN_METADATA: 24 * 60 * 60 * 1000,   // 24 hours
  MARKET_RANKINGS: 2 * 60 * 1000,        // 2 minutes
  HISTORICAL_CHART: 10 * 60 * 1000,      // 10 minutes
  TRENDING: 10 * 60 * 1000,              // 10 minutes
  GLOBAL_STATS: 5 * 60 * 1000,           // 5 minutes
  EXCHANGE_RATES: 5 * 60 * 1000,         // 5 minutes
  SEARCH: 5 * 60 * 1000,                 // 5 minutes
} as const;
