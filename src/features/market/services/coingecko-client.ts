import { cached, TTL } from "@/lib/utils/cache";
import type {
  GlobalData,
  CoinMarket,
  CoinDetail,
  MarketChart,
  TrendingCoin,
  SearchResult,
} from "../types";

const BASE_URL = "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

async function cg<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (API_KEY) {
    headers["x-cg-demo-api-key"] = API_KEY;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`CoinGecko ${res.status}: ${path} — ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Global market stats (total cap, volume, dominance) */
export function getGlobalData(): Promise<GlobalData> {
  return cached("global", TTL.GLOBAL_STATS, async () => {
    const res = await cg<{ data: GlobalData }>("/global");
    return res.data;
  });
}

/** Top coins by market cap (paginated, up to 250 per page) */
export function getCoinsMarkets(
  vsCurrency = "usd",
  page = 1,
  perPage = 50,
  sparkline = true,
): Promise<CoinMarket[]> {
  const key = `markets:${vsCurrency}:${page}:${perPage}`;
  return cached(key, TTL.MARKET_RANKINGS, () =>
    cg<CoinMarket[]>("/coins/markets", {
      vs_currency: vsCurrency,
      order: "market_cap_desc",
      per_page: perPage.toString(),
      page: page.toString(),
      sparkline: sparkline.toString(),
      price_change_percentage: "24h",
    }),
  );
}

/** Full coin detail */
export function getCoinDetail(id: string): Promise<CoinDetail> {
  return cached(`coin:${id}`, TTL.COIN_METADATA, () =>
    cg<CoinDetail>(`/coins/${id}`, {
      localization: "false",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "false",
      sparkline: "false",
    }),
  );
}

/** Historical price chart */
export function getMarketChart(
  id: string,
  vsCurrency = "usd",
  days = "30",
): Promise<MarketChart> {
  const key = `chart:${id}:${vsCurrency}:${days}`;
  return cached(key, TTL.HISTORICAL_CHART, () =>
    cg<MarketChart>(`/coins/${id}/market_chart`, {
      vs_currency: vsCurrency,
      days,
    }),
  );
}

/** Trending coins */
export function getTrending(): Promise<TrendingCoin[]> {
  return cached("trending", TTL.TRENDING, async () => {
    const res = await cg<{ coins: TrendingCoin[] }>("/search/trending");
    return res.coins;
  });
}

/** Search coins */
export function searchCoins(query: string): Promise<SearchResult> {
  const key = `search:${query.toLowerCase()}`;
  return cached(key, TTL.SEARCH, () =>
    cg<SearchResult>("/search", { query }),
  );
}

/** Exchange rates (BTC base) */
export function getExchangeRates(): Promise<Record<string, { name: string; unit: string; value: number; type: string }>> {
  return cached("exchange_rates", TTL.EXCHANGE_RATES, async () => {
    const res = await cg<{ rates: Record<string, { name: string; unit: string; value: number; type: string }> }>("/exchange_rates");
    return res.rates;
  });
}
