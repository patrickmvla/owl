/** Unified market data shape — all upstream formats normalize to this.
 *  The browser never knows or cares if data came from Binance or Finnhub. */
export interface MarketUpdate {
  source: "binance" | "finnhub";
  assetType: "stock" | "crypto";
  symbol: string; // normalized: "BTC/USDT", "AAPL"
  price: number;
  volume: number;
  timestamp: number; // unix ms
  change24h?: number;
  high24h?: number;
  low24h?: number;
}
