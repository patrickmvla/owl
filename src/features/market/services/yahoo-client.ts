import YahooFinance from "yahoo-finance2";
import { cached, TTL } from "@/lib/utils/cache";

/**
 * Yahoo Finance client for historical stock OHLCV data.
 * Uses the `chart` module (recommended over `historical` in v3).
 *
 * Fallback plan: Tiingo free tier (1K req/day, official API).
 */

const yf = new YahooFinance();

export interface StockCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getStockCandles(
  symbol: string,
  days = 90,
): Promise<StockCandle[]> {
  const key = `yahoo:candles:${symbol.toUpperCase()}:${days}`;

  return cached(key, TTL.HISTORICAL_CHART, async () => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const period1 = from.toISOString().split("T")[0]!;

    const result = await yf.chart(symbol.toUpperCase(), {
      period1,
      interval: "1d",
    });

    if (!result?.quotes?.length) return [];

    return result.quotes.map((row: any) => ({
      time: Math.floor(new Date(row.date).getTime() / 1000),
      open: row.open ?? 0,
      high: row.high ?? 0,
      low: row.low ?? 0,
      close: row.close ?? 0,
      volume: row.volume ?? 0,
    }));
  });
}
