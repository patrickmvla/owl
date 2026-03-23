import { cached, TTL } from "@/lib/utils/cache";

const BASE_URL = "https://api.binance.com/api/v3";

/**
 * Binance REST client for public market data.
 * No API key required. All prices are strings from Binance.
 *
 * ADR-001: "REST also available without auth at data-api.binance.vision"
 * Using api.binance.com for better rate limits (6,000 weight/min).
 */

// ============================================
// Types
// ============================================

/** Kline/candlestick tuple from Binance */
export type BinanceKline = [
  number,  // openTime (ms)
  string,  // open
  string,  // high
  string,  // low
  string,  // close
  string,  // volume
  number,  // closeTime (ms)
  string,  // quoteAssetVolume
  number,  // numberOfTrades
  string,  // takerBuyBaseVolume
  string,  // takerBuyQuoteVolume
  string,  // ignore
];

export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface BinanceTickerPrice {
  symbol: string;
  price: string;
}

// ============================================
// Fetch helper
// ============================================

async function bn<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance ${res.status}: ${path} — ${body}`);
  }

  return res.json() as Promise<T>;
}

// ============================================
// Endpoints
// ============================================

/**
 * Kline/candlestick data.
 * Weight: 2 per request.
 *
 * @param symbol - e.g., "BTCUSDT" (uppercase, no separator)
 * @param interval - e.g., "1h", "1d", "1w"
 * @param limit - max 1000, default 500
 */
export function getBinanceKlines(
  symbol: string,
  interval: string,
  limit = 500,
): Promise<BinanceKline[]> {
  const key = `bn:klines:${symbol}:${interval}:${limit}`;
  return cached(key, TTL.HISTORICAL_CHART, () =>
    bn<BinanceKline[]>("/klines", {
      symbol: symbol.toUpperCase().replace("/", ""),
      interval,
      limit: limit.toString(),
    }),
  );
}

/**
 * 24hr ticker stats for a single symbol.
 * Weight: 1.
 */
export function getBinanceTicker24hr(symbol: string): Promise<BinanceTicker24hr> {
  const key = `bn:ticker24:${symbol}`;
  return cached(key, TTL.MARKET_RANKINGS, () =>
    bn<BinanceTicker24hr>("/ticker/24hr", {
      symbol: symbol.toUpperCase().replace("/", ""),
    }),
  );
}

/**
 * Current price for a single symbol.
 * Weight: 1.
 */
export function getBinancePrice(symbol: string): Promise<BinanceTickerPrice> {
  const key = `bn:price:${symbol}`;
  return cached(key, 30_000, () => // 30s cache — prices change fast
    bn<BinanceTickerPrice>("/ticker/price", {
      symbol: symbol.toUpperCase().replace("/", ""),
    }),
  );
}

/**
 * Current prices for all symbols.
 * Weight: 2.
 */
export function getBinanceAllPrices(): Promise<BinanceTickerPrice[]> {
  return cached("bn:all-prices", 30_000, () =>
    bn<BinanceTickerPrice[]>("/ticker/price"),
  );
}

/**
 * Convert Binance klines to a simpler format for charts.
 */
export function klinesToOHLCV(klines: BinanceKline[]) {
  return klines.map((k) => ({
    time: Math.floor(k[0] / 1000), // unix seconds for Lightweight Charts
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}
