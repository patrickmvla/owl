/**
 * Stablecoin configuration for peg monitoring.
 *
 * ADR-004: "Owl's peg monitor must track all of them —
 * USDC, USDT, DAI, EURC, PYUSD, USDB, BUSD"
 *
 * Reality: only USDC/USDT and FDUSD/USDT exist on Binance.
 * Other stablecoins use CoinGecko REST as price source.
 */

export type RiskGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

export interface StablecoinConfig {
  id: string;             // CoinGecko ID for REST fallback
  symbol: string;         // Display symbol
  wsSymbol: string | null; // Binance WS symbol (null = no WS coverage)
  pegCurrency: "USD" | "EUR";
  pegTarget: number;
  thresholds: {
    warning: number;
    critical: number;
  };
  riskGrade: RiskGrade;
  riskNote: string;       // one-line reason for the grade
}

export const STABLECOINS: StablecoinConfig[] = [
  {
    id: "usd-coin",
    symbol: "USDC",
    wsSymbol: "USDC/USDT",
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.2, critical: 0.5 },
    riskGrade: "B+",
    riskNote: "Circle can freeze wallets, US regulatory exposure",
  },
  {
    id: "tether",
    symbol: "USDT",
    wsSymbol: null, // USDT IS the quote currency — use CoinGecko
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.2, critical: 0.5 },
    riskGrade: "C",
    riskNote: "Reserve audit opacity, regulatory uncertainty",
  },
  {
    id: "dai",
    symbol: "DAI",
    wsSymbol: null, // Not on Binance — use CoinGecko
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.3, critical: 0.8 },
    riskGrade: "A-",
    riskNote: "Over-collateralized, decentralized governance, smart contract risk",
  },
  {
    id: "euro-coin",
    symbol: "EURC",
    wsSymbol: null, // Not on Binance — use CoinGecko
    pegCurrency: "EUR",
    pegTarget: 1.0,
    thresholds: { warning: 0.3, critical: 0.8 },
    riskGrade: "B+",
    riskNote: "Circle-issued, same risks as USDC, EUR-denominated",
  },
  {
    id: "paypal-usd",
    symbol: "PYUSD",
    wsSymbol: null, // Not on Binance — use CoinGecko
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.2, critical: 0.5 },
    riskGrade: "B",
    riskNote: "PayPal-backed, US regulated, newer entrant",
  },
  {
    id: "first-digital-usd",
    symbol: "FDUSD",
    wsSymbol: "FDUSD/USDT",
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.2, critical: 0.5 },
    riskGrade: "B-",
    riskNote: "First Digital, less established issuer",
  },
  {
    id: "true-usd",
    symbol: "TUSD",
    wsSymbol: "TUSD/USDT",
    pegCurrency: "USD",
    pegTarget: 1.0,
    thresholds: { warning: 0.3, critical: 0.8 },
    riskGrade: "C+",
    riskNote: "History of reserve transparency questions",
  },
];

/** Stablecoins with Binance WS coverage */
export const WS_STABLECOINS = STABLECOINS.filter((s) => s.wsSymbol != null);

/** Binance stream symbols for peg monitoring */
export const PEG_STREAM_SYMBOLS = WS_STABLECOINS.map((s) => s.wsSymbol!);

/** Stablecoins requiring CoinGecko REST */
export const REST_STABLECOINS = STABLECOINS.filter((s) => s.wsSymbol == null);
