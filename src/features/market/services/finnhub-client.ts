import { cached, TTL } from "@/lib/utils/cache";

const BASE_URL = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY;

/**
 * Finnhub REST client for stock market data.
 * Free tier: 60 calls/min, US stocks, daily candles only.
 *
 * ADR-001: "Finnhub — Stocks, forex, company news.
 * The only provider in our stack covering traditional equities."
 */

// ============================================
// Types
// ============================================

export interface FinnhubQuote {
  c: number;   // current price
  h: number;   // day high
  l: number;   // day low
  o: number;   // day open
  pc: number;  // previous close
  d: number;   // change
  dp: number;  // percent change
  t: number;   // timestamp (unix seconds)
}

export interface FinnhubCompanyProfile {
  ticker: string;
  name: string;
  exchange: string;
  ipo: string;
  finnhubIndustry: string;
  logo: string;
  weburl: string;
  currency: string;
  country: string;
  marketCapitalization: number; // millions USD
  shareOutstanding: number;    // millions
}

export interface FinnhubSearchResult {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

export type FinnhubCandleResult =
  | { s: "ok"; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }
  | { s: "no_data" };

// ============================================
// Fetch helper
// ============================================

async function fh<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (!API_KEY) throw new Error("FINNHUB_API_KEY not set");

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("token", API_KEY);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Finnhub ${res.status}: ${path} — ${body}`);
  }

  return res.json() as Promise<T>;
}

// ============================================
// Endpoints
// ============================================

/** Real-time stock quote (~15 min delay on free tier) */
export function getStockQuote(symbol: string): Promise<FinnhubQuote> {
  return cached(`fh:quote:${symbol}`, 60_000, () =>
    fh<FinnhubQuote>("/quote", { symbol: symbol.toUpperCase() }),
  );
}

/** Company profile (name, logo, industry, market cap) */
export function getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile | null> {
  return cached(`fh:profile:${symbol}`, TTL.COIN_METADATA, async () => {
    const profile = await fh<FinnhubCompanyProfile>("/stock/profile2", { symbol: symbol.toUpperCase() });
    // Finnhub returns {} for unknown symbols
    if (!profile.ticker) return null;
    return profile;
  });
}

/** Search stocks by name or ticker */
export function searchStocks(query: string): Promise<FinnhubSearchResult> {
  return cached(`fh:search:${query.toLowerCase()}`, TTL.SEARCH, () =>
    fh<FinnhubSearchResult>("/search", { q: query, exchange: "US" }),
  );
}

/** Historical daily candles */
export function getStockCandles(
  symbol: string,
  from: number, // unix seconds
  to: number,   // unix seconds
): Promise<FinnhubCandleResult> {
  const key = `fh:candle:${symbol}:${from}:${to}`;
  return cached(key, TTL.HISTORICAL_CHART, () =>
    fh<FinnhubCandleResult>("/stock/candle", {
      symbol: symbol.toUpperCase(),
      resolution: "D",
      from: from.toString(),
      to: to.toString(),
    }),
  );
}

/**
 * Convert Finnhub candle response to array format for charts.
 */
export function candlesToOHLCV(result: FinnhubCandleResult) {
  if (result.s !== "ok" || !result.t?.length) return [];

  return result.t.map((time, i) => ({
    time,
    open: result.o[i] ?? 0,
    high: result.h[i] ?? 0,
    low: result.l[i] ?? 0,
    close: result.c[i] ?? 0,
    volume: result.v[i] ?? 0,
  }));
}
