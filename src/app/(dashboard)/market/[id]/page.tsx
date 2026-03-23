import { Suspense } from "react";
import { getCoinDetail } from "@/features/market/services/coingecko-client";
import { CoinDetailHeader } from "@/features/market/components/coin-detail-header";
import { CoinDetailChart } from "@/features/market/components/coin-detail-chart";
import { formatPrice, formatPercent, formatCompact, formatNumber } from "@/lib/utils/format";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = await getCoinDetail(id);

  if (!coin) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Coin not found</p>
      </div>
    );
  }

  const symbol = coin.symbol.toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Header — Client Component (needs usePathname for watchlist, usePrice for live) */}
      <CoinDetailHeader
        coinId={id}
        name={coin.name}
        symbol={symbol}
        image={coin.image?.large ?? ""}
        rank={coin.market_cap_rank}
        fallbackPrice={coin.market_data?.current_price?.usd ?? 0}
        change24h={coin.market_data?.price_change_percentage_24h ?? 0}
        ath={coin.market_data?.ath?.usd ?? 0}
      />

      <div className="flex-1 overflow-auto">
        {/* Chart — Client Component (Lightweight Charts canvas) */}
        <Suspense fallback={<div className="h-[400px] animate-pulse rounded-sm bg-card mx-6 mt-4" />}>
          <CoinDetailChart coinId={id} />
        </Suspense>

        {/* Stats grid — Server Component (pure HTML) */}
        <div className="grid grid-cols-2 gap-px border-t border-border mt-4 bg-border lg:grid-cols-4">
          {[
            { label: "MKT CAP", value: formatCompact(coin.market_data?.market_cap?.usd ?? 0) },
            { label: "24H VOL", value: formatCompact(coin.market_data?.total_volume?.usd ?? 0) },
            { label: "CIRC SUPPLY", value: `${formatNumber(coin.market_data?.circulating_supply ?? 0, 0)} ${symbol}` },
            { label: "MAX SUPPLY", value: coin.market_data?.max_supply ? formatNumber(coin.market_data.max_supply, 0) : "∞" },
            { label: "ATH", value: formatPrice(coin.market_data?.ath?.usd ?? 0) },
            { label: "ATL", value: formatPrice(coin.market_data?.atl?.usd ?? 0) },
            { label: "7D", value: formatPercent(coin.market_data?.price_change_percentage_7d ?? null) },
            { label: "30D", value: formatPercent(coin.market_data?.price_change_percentage_30d ?? null) },
          ].map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-3 space-y-0.5">
              <span className="label-micro">{stat.label}</span>
              <div className="text-xs font-medium tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Description — Server Component (pure HTML) */}
        {coin.description?.en && (
          <div className="px-6 py-4 space-y-2">
            <span className="label-micro">About {coin.name}</span>
            <p
              className="text-xs text-muted-foreground leading-relaxed line-clamp-4"
              dangerouslySetInnerHTML={{ __html: coin.description.en.split(". ").slice(0, 3).join(". ") + "." }}
            />
          </div>
        )}

        {/* Links — Server Component (pure HTML) */}
        {coin.links && (
          <div className="px-6 pb-6 flex flex-wrap gap-3">
            {coin.links.homepage?.[0] && (
              <a
                href={coin.links.homepage[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowSquareOut size={12} />
                Website
              </a>
            )}
            {coin.links.repos_url?.github?.[0] && (
              <a
                href={coin.links.repos_url.github[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowSquareOut size={12} />
                GitHub
              </a>
            )}
            {coin.links.subreddit_url && (
              <a
                href={coin.links.subreddit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowSquareOut size={12} />
                Reddit
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
