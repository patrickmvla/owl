/** CoinGecko /global response */
export interface GlobalData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
}

/** CoinGecko /coins/markets item */
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

/** CoinGecko /coins/{id} response (subset) */
export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  image: { large: string; small: string; thumb: string };
  market_cap_rank: number | null;
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_date: Record<string, string>;
  };
  last_updated: string;
}

/** CoinGecko /coins/{id}/market_chart response */
export interface MarketChart {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/** CoinGecko /search/trending item */
export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
    data: {
      price: number;
      price_btc: string;
      price_change_percentage_24h: Record<string, number>;
      market_cap: string;
      market_cap_btc: string;
      total_volume: string;
      total_volume_btc: string;
      sparkline: string;
    };
  };
}

/** CoinGecko /search response */
export interface SearchResult {
  coins: {
    id: string;
    name: string;
    api_symbol: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
    large: string;
  }[];
}
