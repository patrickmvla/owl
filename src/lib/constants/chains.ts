/**
 * Blockchain chain configuration for settlement optimization.
 *
 * ADR-004: "Vole operates on 7 chains. Stablecoin conversion rates
 * vary by chain. The settlement optimizer should show which chain
 * offers the best rate."
 *
 * Gas estimates are static for MVP. Upgrade path: live fetching via
 * Ankr public RPC (eth_gasPrice) + mempool.space + TronGrid.
 * See docs/performance-debt.md for the live gas roadmap.
 */

export interface ChainConfig {
  id: string;
  name: string;
  shortName: string;
  /** Estimated USD cost for a stablecoin (ERC-20/TRC-20) transfer */
  estimatedGasUsd: number;
  /** Native token used for gas */
  gasToken: string;
  /** Stablecoins available on this chain */
  stablecoins: string[];
  /** Is this Vole's primary chain? */
  isPrimary: boolean;
  /** Chain type for display */
  type: "L1" | "L2" | "UTXO" | "Other";
}

export const CHAINS: ChainConfig[] = [
  {
    id: "base",
    name: "Base",
    shortName: "Base",
    estimatedGasUsd: 0.002,
    gasToken: "ETH",
    stablecoins: ["USDC", "DAI"],
    isPrimary: true,
    type: "L2",
  },
  {
    id: "arbitrum",
    name: "Arbitrum One",
    shortName: "Arbitrum",
    estimatedGasUsd: 0.005,
    gasToken: "ETH",
    stablecoins: ["USDC", "USDT", "DAI"],
    isPrimary: false,
    type: "L2",
  },
  {
    id: "polygon",
    name: "Polygon PoS",
    shortName: "Polygon",
    estimatedGasUsd: 0.001,
    gasToken: "POL",
    stablecoins: ["USDC", "USDT", "DAI"],
    isPrimary: false,
    type: "L1",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    shortName: "Ethereum",
    estimatedGasUsd: 0.02,
    gasToken: "ETH",
    stablecoins: ["USDC", "USDT", "DAI", "PYUSD"],
    isPrimary: false,
    type: "L1",
  },
  {
    id: "bsc",
    name: "BNB Smart Chain",
    shortName: "BSC",
    estimatedGasUsd: 0.01,
    gasToken: "BNB",
    stablecoins: ["USDT", "FDUSD"],
    isPrimary: false,
    type: "L1",
  },
  {
    id: "tron",
    name: "TRON",
    shortName: "TRON",
    estimatedGasUsd: 2.0,
    gasToken: "TRX",
    stablecoins: ["USDT"],
    isPrimary: false,
    type: "Other",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    shortName: "Bitcoin",
    estimatedGasUsd: 1.0,
    gasToken: "BTC",
    stablecoins: [],
    isPrimary: false,
    type: "UTXO",
  },
];

/** Chains that support stablecoin transfers (exclude Bitcoin for settlement) */
export const SETTLEMENT_CHAINS = CHAINS.filter((c) => c.stablecoins.length > 0);
