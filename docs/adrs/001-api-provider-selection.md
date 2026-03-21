# ADR-001: API Provider Selection for Market Data

**Status:** Accepted
**Date:** 2026-03-21
**Decision Makers:** @mvula

## Context

Owl is a real-time financial dashboard that bridges traditional markets (stocks/forex) and cryptocurrency — targeting users who operate across both worlds (freelancers, remote workers, traders using fiat-to-stablecoin rails).

We need reliable, cost-effective data sources for:
1. Real-time stock/forex prices and trades
2. Real-time cryptocurrency prices and trades
3. Crypto metadata (market cap, rankings, descriptions, supply, categories, historical charts)

The system must support WebSocket-based real-time feeds for both asset classes while remaining viable on a $0 API budget.

## Decision

We will use three API providers, each serving a distinct role with zero overlap:

| Provider | Role | Protocol | Cost |
|----------|------|----------|------|
| **Finnhub** | Stocks, forex, company news | WebSocket + REST | $0 (free tier) |
| **Binance** | Real-time crypto prices and trades | WebSocket + REST | $0 (public, no auth) |
| **CoinGecko** | Crypto metadata, market context, historical data | REST only | $0 (Demo plan) |

## Options Considered

### Option 1: CoinGecko (Free REST) + Finnhub (Free WebSocket)

The original plan — use CoinGecko for all crypto data and Finnhub for equities.

**Rejected because:**
- CoinGecko free tier is REST-only, no WebSocket (WebSocket requires Analyst plan at $129/month)
- REST polling at best gives ~60-second data freshness — not acceptable for a "real-time" dashboard
- 30 calls/min and 10,000 calls/month cap would be consumed rapidly by price polling alone, leaving no budget for metadata endpoints

### Option 2: CoinGecko (Paid Analyst Plan) + Finnhub

Full real-time on both sides via WebSocket.

**Rejected because:**
- $129/month is excessive for a portfolio project
- The paid plan's primary advantage (WebSocket) can be achieved for free via exchange APIs

### Option 3: Binance WebSocket + Finnhub WebSocket (No CoinGecko)

Use exchange APIs exclusively for all data.

**Rejected because:**
- Binance and Finnhub are exchange/market data providers — they serve price and trade data only
- Neither provides: market cap, circulating supply, coin descriptions, categories, trending coins, global market overview, developer/community metrics, ATH/ATL data
- This metadata is critical for a dashboard that aims to provide market context, not just price tickers

### Option 4: Coinbase WebSocket + Finnhub (Instead of Binance)

Use Coinbase's free WebSocket for crypto real-time data.

**Rejected because:**
- Fewer trading pairs (~379 coins vs Binance's ~1,500+)
- Lower connection rate limits (8 conn/sec vs Binance's 300 conn/5min)
- Coinbase's strength (simple price API) is already covered by CoinGecko REST
- Binance's WebSocket is faster, better documented, and more battle-tested at scale

### Option 5 (Selected): Binance WebSocket + CoinGecko REST + Finnhub WebSocket

Each provider handles what it's best at. No overlap, no waste.

## Rationale

### Finnhub — Stocks & Forex
- Free WebSocket included (limited to 50 symbols simultaneously)
- 60 REST API calls/min on free tier
- Real-time trade and news feeds
- The only provider in our stack covering traditional equities
- **Trade-off:** 50-symbol WebSocket limit is sufficient for a watchlist-based dashboard but won't support "all stocks at once" views. This is acceptable — users track specific symbols, not the entire NYSE.

### Binance — Real-Time Crypto
- WebSocket is fully public, no API key or authentication required
- Streams available: trades, tickers (individual + mini), klines (16 intervals), order book (depth), book ticker
- ~1,500+ trading pairs with real-time to 100ms update speeds
- Connection limits: 300 connections per 5 minutes, 1,024 streams per connection
- REST also available without auth at `data-api.binance.vision`
- **Trade-off: Geo-restriction.** Binance.com is blocked in the US, Canada, Netherlands, and sanctioned regions. Mitigation: implement region-aware API routing that switches between `api.binance.com` (global) and `api.binance.us` (US). Binance.US has the same endpoint structure but fewer pairs (~150) and lower rate limits (1,200 weight/min vs 6,000).
- **Trade-off: 24-hour connection expiry.** WebSocket connections must be re-established every 24 hours. The relay service must implement automatic reconnection with stream resubscription.
- **Deprecation notice:** `!ticker@arr` (all market tickers stream) is being retired 2026-03-26. Use individual `<symbol>@ticker` or `!miniTicker@arr` instead.

### CoinGecko — Crypto Metadata & Market Context
- Free Demo plan: 30 calls/min, 10,000 calls/month
- Provides data no exchange API offers: market cap, rankings, supply metrics, coin descriptions, categories, trending coins, global market overview, developer/community stats, ATH/ATL, public company BTC/ETH holdings
- Historical chart data up to 365 days (auto-granularity: 5min/hourly/daily depending on range)
- Batch endpoints (`/coins/markets` supports up to 250 coins per call, `/simple/price` supports comma-separated IDs) minimize call consumption
- **Trade-off: Tight rate limits.** 30 calls/min and 10,000/month means we must cache aggressively. Metadata (descriptions, categories) can be cached for hours. Market data (prices, market cap) cached for 60-120 seconds. Historical charts cached for 5-15 minutes. Redis or in-memory cache with TTL-based invalidation.
- **Trade-off: 60-second data freshness.** This is acceptable because CoinGecko is not our real-time source — Binance handles that. CoinGecko data powers slower-updating views (portfolio overview, market rankings, coin detail pages).
- **Gotcha:** Every failed request (4xx/5xx) counts toward rate limits. Implement retry with exponential backoff and circuit breaker patterns.
- **Gotcha:** Historical data granularity is auto-selected on free tier. We cannot request specific intervals — the API chooses based on date range (1d=5min, 2-90d=hourly, 90d+=daily).

## Consequences

### Positive
- $0 total API cost — sustainable indefinitely for a portfolio project
- True real-time for both asset classes (stocks via Finnhub WS, crypto via Binance WS)
- Rich metadata layer via CoinGecko that no exchange API can match
- Clear separation of concerns — each provider has a single responsibility
- No vendor lock-in on any single provider — each layer is independently replaceable

### Negative
- Three external dependencies increases surface area for failures — need graceful degradation for each
- Binance geo-restriction requires conditional API routing logic
- CoinGecko rate limits demand disciplined caching and call budgeting
- Finnhub's 50-symbol WebSocket limit constrains the real-time equities view
- Must handle three different response formats and normalize into a unified internal schema

### Risks
- Any provider could change their free tier terms (deprecate, add auth requirements, reduce limits)
- Binance API deprecation cycle is aggressive — need to monitor their changelog
- CoinGecko's 10,000 monthly call cap could be hit in production if caching is misconfigured

## Related Decisions
- ADR-002: Real-Time Architecture (WebSocket relay vs SSE vs polling) — pending
- ADR-003: Caching Strategy — pending
