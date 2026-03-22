import type { MarketUpdate } from "@/lib/types/market";

/**
 * Binance mini ticker stream message shape.
 * Stream: <symbol>@miniTicker
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
 */
interface BinanceMiniTicker {
  e: "24hrMiniTicker";
  E: number; // event time
  s: string; // symbol e.g. "BTCUSDT"
  c: string; // close price
  o: string; // open price
  h: string; // high price
  l: string; // low price
  v: string; // base asset volume
  q: string; // quote asset volume
}

/**
 * Normalize a Binance symbol to our format.
 * "BTCUSDT" → "BTC/USDT"
 * "ETHUSDT" → "ETH/USDT"
 */
function normalizeBinanceSymbol(raw: string): string {
  // Common quote assets in order of length (longest first to match correctly)
  const quotes = ["USDT", "USDC", "BUSD", "FDUSD", "BTC", "ETH", "BNB"];

  for (const quote of quotes) {
    if (raw.endsWith(quote)) {
      const base = raw.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
  }

  return raw;
}

/** Normalize a Binance mini ticker message to MarketUpdate */
export function normalizeBinanceTicker(msg: BinanceMiniTicker): MarketUpdate {
  const close = parseFloat(msg.c);
  const open = parseFloat(msg.o);

  const result: MarketUpdate = {
    source: "binance",
    assetType: "crypto",
    symbol: normalizeBinanceSymbol(msg.s),
    price: close,
    volume: parseFloat(msg.q), // quote volume (USD value)
    timestamp: msg.E,
    high24h: parseFloat(msg.h),
    low24h: parseFloat(msg.l),
  };

  if (open > 0) {
    result.change24h = ((close - open) / open) * 100;
  }

  return result;
}

/**
 * Finnhub trade message shape (from relay).
 * The relay forwards raw Finnhub data.
 */
interface FinnhubTrade {
  s: string; // symbol e.g. "AAPL"
  p: number; // last price
  v: number; // volume
  t: number; // timestamp (ms)
}

/** Normalize a Finnhub trade message to MarketUpdate */
export function normalizeFinnhubTrade(msg: FinnhubTrade): MarketUpdate {
  return {
    source: "finnhub",
    assetType: "stock",
    symbol: msg.s,
    price: msg.p,
    volume: msg.v,
    timestamp: msg.t,
  };
}
