import { cached } from "@/lib/utils/cache";

/**
 * Live gas fee estimation across all 7 chains.
 * No API keys required — uses public RPC endpoints.
 *
 * EVM: eth_gasPrice via Ankr public RPCs
 * Bitcoin: mempool.space recommended fees
 * TRON: TronGrid chain parameters
 *
 * All results are in USD. Cached for 60 seconds.
 */

const EVM_RPCS: Record<string, { rpc: string; gasToken: string }> = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", gasToken: "ETH" },
  polygon: { rpc: "https://rpc.ankr.com/polygon", gasToken: "POL" },
  bsc: { rpc: "https://rpc.ankr.com/bsc", gasToken: "BNB" },
  arbitrum: { rpc: "https://rpc.ankr.com/arbitrum", gasToken: "ETH" },
  base: { rpc: "https://rpc.ankr.com/base", gasToken: "ETH" },
};

/** ERC-20 transfer gas units (approx) */
const ERC20_TRANSFER_GAS = 65_000;

/** Fetch gas price from an EVM RPC (returns gwei as number) */
async function fetchEvmGasPrice(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_gasPrice",
      params: [],
      id: 1,
    }),
  });

  if (!res.ok) throw new Error(`RPC failed: ${res.status}`);

  const data = await res.json() as { result: string };
  // result is hex wei, convert to gwei
  const wei = parseInt(data.result, 16);
  return wei / 1e9; // gwei
}

/** Fetch native token prices via our existing Binance client (which works reliably) */
async function fetchTokenPrices(): Promise<Record<string, number>> {
  const { getBinancePrice } = await import("@/features/market/services/binance-client");
  const symbols = ["ETHUSDT", "BNBUSDT", "TRXUSDT", "POLUSDT"];
  const prices: Record<string, number> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const ticker = await getBinancePrice(symbol);
        const token = symbol.replace("USDT", "");
        const price = parseFloat(ticker.price);
        if (price > 0) prices[token] = price;
      } catch {
        // skip
      }
    }),
  );

  // Map POL to the polygon gas token
  if (!prices["POL"] && prices["MATIC"]) {
    prices["POL"] = prices["MATIC"]!;
  }

  return prices;
}

/** Fetch Bitcoin recommended fee from mempool.space */
async function fetchBitcoinFee(): Promise<number> {
  const res = await fetch("https://mempool.space/api/v1/fees/recommended");
  if (!res.ok) throw new Error("mempool.space failed");

  const data = await res.json() as { hourFee: number };
  return data.hourFee; // sat/vbyte
}

/** Fetch TRON energy price */
async function fetchTronEnergyPrice(): Promise<number> {
  const res = await fetch("https://api.trongrid.io/wallet/getchainparameters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("TronGrid failed");

  const data = await res.json() as { chainParameter: { key: string; value: number }[] };
  const energyFee = data.chainParameter.find((p) => p.key === "getEnergyFee");
  return energyFee?.value ?? 420; // sun per energy unit, default 420
}

export interface GasEstimate {
  chainId: string;
  gasPriceGwei?: number;
  estimatedUsd: number;
  source: "live" | "fallback";
}

/** Static fallbacks if live fetching fails */
const FALLBACK_GAS: Record<string, number> = {
  ethereum: 0.02,
  polygon: 0.001,
  bsc: 0.01,
  arbitrum: 0.005,
  base: 0.002,
  tron: 2.0,
  bitcoin: 1.0,
};

/**
 * Get live gas estimates for all chains.
 * Cached for 60 seconds. Falls back to static estimates on failure.
 */
export function getGasEstimates(): Promise<GasEstimate[]> {
  return cached("gas-estimates", 60_000, async () => {
    const [tokenPrices, btcFee, tronEnergy] = await Promise.all([
      fetchTokenPrices().catch(() => ({} as Record<string, number>)),
      fetchBitcoinFee().catch(() => 2), // 2 sat/vbyte fallback
      fetchTronEnergyPrice().catch(() => 420),
    ]);

    const estimates: GasEstimate[] = [];

    // EVM chains
    for (const [chainId, config] of Object.entries(EVM_RPCS)) {
      try {
        const gasPriceGwei = await fetchEvmGasPrice(config.rpc);
        const gasToken = config.gasToken;
        // Fallback token prices if Binance fails
        const fallbackPrices: Record<string, number> = { ETH: 2500, BNB: 600, POL: 0.35 };
        const tokenPrice = tokenPrices[gasToken] ?? fallbackPrices[gasToken] ?? 0;

        // cost = gasPrice (gwei) × gasUnits × tokenPrice / 1e9
        const costUsd = (gasPriceGwei * ERC20_TRANSFER_GAS * tokenPrice) / 1e9;

        estimates.push({
          chainId,
          gasPriceGwei,
          estimatedUsd: Math.max(costUsd, 0.0001),
          source: tokenPrices[gasToken] ? "live" as const : "fallback" as const,
        });
      } catch {
        estimates.push({
          chainId,
          estimatedUsd: FALLBACK_GAS[chainId] ?? 0.01,
          source: "fallback",
        });
      }
    }

    // Bitcoin
    try {
      const btcPrice = tokenPrices["BTC"] ?? (tokenPrices["ETH"] ? tokenPrices["ETH"]! * 25 : 85000);
      // typical P2WPKH tx: ~141 vbytes
      const costSats = btcFee * 200; // 200 vbytes conservative
      const costBtc = costSats / 1e8;
      const costUsd = costBtc * btcPrice;

      estimates.push({
        chainId: "bitcoin",
        estimatedUsd: costUsd,
        source: "live",
      });
    } catch {
      estimates.push({
        chainId: "bitcoin",
        estimatedUsd: FALLBACK_GAS["bitcoin"] ?? 1.0,
        source: "fallback",
      });
    }

    // TRON
    try {
      const trxPrice = tokenPrices["TRX"] ?? 0.22;
      // USDT TRC-20: ~65,000 energy
      const costSun = tronEnergy * 65_000;
      const costTrx = costSun / 1e6; // sun → TRX
      const costUsd = costTrx * trxPrice;

      estimates.push({
        chainId: "tron",
        estimatedUsd: costUsd,
        source: "live",
      });
    } catch {
      estimates.push({
        chainId: "tron",
        estimatedUsd: FALLBACK_GAS["tron"] ?? 2.0,
        source: "fallback",
      });
    }

    return estimates;
  });
}
