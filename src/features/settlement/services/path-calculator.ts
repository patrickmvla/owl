import { SETTLEMENT_CHAINS, type ChainConfig } from "@/lib/constants/chains";
import { STABLECOINS, type RiskGrade } from "@/lib/constants/stablecoins";

export interface SettlementPath {
  chain: ChainConfig;
  stablecoin: string;
  riskGrade: RiskGrade;
  riskNote: string;
  rate: number;
  gasFeeUsd: number;
  inputUsd: number;
  netAmount: number;
  netValueUsd: number;
  /** How much USD value is lost vs input */
  lossUsd: number;
  /** Loss as percentage of input */
  lossPercent: number;
  rank: number;
  isRecommended: boolean;
}

export function calculateSettlementPaths(
  inputUsd: number,
  stablecoinPrices: Map<string, number>,
  chains?: ChainConfig[],
): SettlementPath[] {
  const paths: SettlementPath[] = [];

  for (const chain of (chains ?? SETTLEMENT_CHAINS)) {
    for (const stablecoin of chain.stablecoins) {
      const rate = stablecoinPrices.get(stablecoin) ?? 1.0;
      const gasFeeUsd = chain.estimatedGasUsd;
      const netAmount = rate > 0 ? Math.max(0, (inputUsd - gasFeeUsd) / rate) : 0;
      const netValueUsd = Math.max(0, netAmount * rate);
      const lossUsd = Math.max(0, inputUsd - netValueUsd);
      const lossPercent = inputUsd > 0 ? (lossUsd / inputUsd) * 100 : 0;

      const stablecoinConfig = STABLECOINS.find((s) => s.symbol === stablecoin);

      paths.push({
        chain,
        stablecoin,
        riskGrade: stablecoinConfig?.riskGrade ?? "B",
        riskNote: stablecoinConfig?.riskNote ?? "",
        rate,
        gasFeeUsd,
        inputUsd,
        netAmount,
        netValueUsd,
        lossUsd,
        lossPercent,
        rank: 0,
        isRecommended: false,
      });
    }
  }

  paths.sort((a, b) => b.netValueUsd - a.netValueUsd);

  for (let i = 0; i < paths.length; i++) {
    paths[i]!.rank = i + 1;
  }

  const best = paths[0];
  if (best) {
    const primaryPath = paths.find((p) => p.chain.isPrimary);
    if (primaryPath && best.netValueUsd > 0) {
      const diff = (best.netValueUsd - primaryPath.netValueUsd) / best.netValueUsd;
      if (diff < 0.001) {
        primaryPath.isRecommended = true;
      } else {
        best.isRecommended = true;
      }
    } else {
      best.isRecommended = true;
    }
  }

  return paths;
}
