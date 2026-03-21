# ADR-002: System Architecture

**Status:** Accepted
**Date:** 2026-03-21
**Decision Makers:** @mvula

## Context

Owl requires a system architecture that supports:
- Real-time price streaming for both stocks and crypto
- A type-safe API layer for portfolio management, market data, and alerts
- Authentication that works across the Vercel frontend and a Finnhub relay on Cloudflare Durable Objects
- Aggressive caching to stay within CoinGecko's free tier rate limits (30 calls/min, 10K/month)
- Staged delivery where each stage ships a working feature

Key constraints:
- Vercel is serverless — cannot maintain persistent WebSocket connections or proxy WebSocket upgrades
- Binance public WebSocket requires no auth — browsers can connect directly
- Finnhub WebSocket requires an API key in the URL — must be proxied server-side to avoid exposure
- See [ADR-003](./003-websocket-hosting.md) for the full evaluation of WebSocket hosting options

### Infrastructure Decisions
- **Database:** Supabase (Postgres only — no auth, no storage, no realtime, just the database)
- **ORM:** Drizzle
- **API:** Hono with RPC client, mounted inside Next.js catch-all route
- **Auth:** Better Auth
- **Real-time (crypto):** Direct browser WebSocket to Binance (no backend)
- **Real-time (stocks):** Finnhub relay on Cloudflare Workers + Durable Objects (API key hidden server-side, lazy connection pattern)

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph Browser["Browser"]
        UI["Next.js App (React)"]
        RPC["Hono RPC Client"]
        BN_WS["Binance WS Client<br/>(direct, no auth)"]
        FH_WS["Finnhub Relay Client"]
        NORM_C["Client-Side Normalizer<br/>(merges both streams)"]

        UI --> RPC
        UI --> BN_WS
        UI --> FH_WS
        BN_WS --> NORM_C
        FH_WS --> NORM_C
    end

    subgraph Vercel["Vercel (Serverless)"]
        HONO["Hono API Server"]
        AUTH["Auth Service<br/>(Better Auth)"]
        PORT["Portfolio Service"]
        MKT["Market Service"]
        CORR["Correlation Service"]
        ALRT["Alert Service"]
        CACHE["Cache Layer<br/>(In-Memory + TTL)"]

        HONO --> AUTH
        HONO --> PORT
        HONO --> MKT
        HONO --> CORR
        HONO --> ALRT
        MKT --> CACHE
    end

    subgraph Cloudflare["Cloudflare Workers + Durable Objects"]
        WORKER["Hono Worker<br/>(Edge Router)"]
        DO["Durable Object<br/>(Finnhub Relay)"]
        FH_HANDLER["Finnhub WS Handler<br/>• lazy connection<br/>• auto-reconnect"]
        JWT_VAL["JWT Validator"]
        BCAST["Broadcaster"]

        WORKER --> DO
        DO --> FH_HANDLER
        DO --> JWT_VAL
        FH_HANDLER --> BCAST
    end

    subgraph External["External Services"]
        FINNHUB["Finnhub API<br/>(Stocks WS + REST)"]
        BINANCE["Binance API<br/>(Crypto WS)"]
        COINGECKO["CoinGecko API<br/>(Crypto REST)"]
        RESEND["Resend<br/>(Email)"]
    end

    subgraph Data["Data Layer"]
        PG["Supabase<br/>(Postgres Only)"]
    end

    RPC -->|"HTTP/RPC"| HONO
    BN_WS -->|"WSS (direct, no auth)"| BINANCE
    FH_WS -->|"WSS + JWT"| WORKER
    FH_HANDLER -->|"WSS + API key<br/>(hidden server-side)"| FINNHUB

    CACHE -->|"REST (cached)"| COINGECKO
    ALRT -->|"SMTP"| RESEND

    AUTH --> PG
    PORT --> PG
    ALRT --> PG
```

### Why This Topology

The browser manages **two** WebSocket connections independently:

| Connection | Target | Auth Required | Goes Through Backend |
|-----------|--------|--------------|---------------------|
| Crypto prices | Binance directly | No (public API) | No |
| Stock prices | Finnhub relay on Cloudflare DO | JWT (to access relay) | Yes (API key hidden) |

A client-side normalizer merges both streams into a unified `MarketUpdate` shape so the rest of the UI doesn't know or care where data came from.

This is the minimal architecture — no unnecessary middleware between the browser and Binance, and only the smallest possible relay for Finnhub where we actually need one.

---

## Directory Structure

```mermaid
graph LR
    subgraph Root["src/"]
        subgraph App["app/ — Next.js Frontend"]
            API["api/[[...route]]/route.ts<br/>← Hono mount point"]
            PAGES["(dashboard)/<br/>(portfolio)/<br/>(market)/<br/>(alerts)/"]
            LAYOUT["layout.tsx"]
        end

        subgraph Server["server/ — Backend"]
            SAPI["api/<br/>routes + RPC definitions"]
            SVC["services/<br/>portfolio.ts | market.ts<br/>correlation.ts | alert.ts"]
            DB["db/<br/>schema.ts | index.ts<br/>migrations/"]
            WS["relay/ (deploys to CF Workers)<br/>wrangler.jsonc<br/>src/index.ts (Hono Worker)<br/>src/finnhub-relay.ts (DO class)"]
        end

        subgraph Lib["lib/ — Shared"]
            TYPES["types/<br/>market.ts | portfolio.ts"]
            VALID["validators/<br/>zod schemas"]
            CONST["constants/<br/>config, enums"]
            WSHOOKS["hooks/<br/>use-binance-ws.ts<br/>use-finnhub-ws.ts<br/>use-market-stream.ts"]
        end
    end
```

Note: The `relay/` directory is a separate deployable unit targeting Cloudflare Workers. No Binance handler on the server — the browser connects to Binance directly. Normalization lives in client-side hooks.

---

## Data Flow Maps

### Flow 1: Dashboard Load (Initial + Real-Time)

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Hono API (Vercel)
    participant C as Cache Layer
    participant CG as CoinGecko REST
    participant BN as Binance (Direct WS)
    participant R as Finnhub Relay (CF DO)
    participant FH as Finnhub (Upstream)

    Note over B,FH: Phase 1 — Initial Data Load (HTTP)
    B->>H: GET /api/market/overview (RPC)
    H->>C: Check cache (global stats, trending)
    alt Cache HIT
        C-->>H: Return cached data
    else Cache MISS
        C->>CG: GET /global + /search/trending
        CG-->>C: Market data
        C-->>H: Store + return
    end
    H-->>B: Market overview response

    Note over B,FH: Phase 2a — Crypto Real-Time (Direct)
    B->>BN: Connect wss://stream.binance.com:9443
    Note right of B: No auth needed — public API
    B->>BN: Subscribe btcusdt@ticker, ethusdt@ticker
    loop Crypto Stream
        BN-->>B: Ticker update (raw Binance format)
        B->>B: Normalize to MarketUpdate
    end

    Note over B,FH: Phase 2b — Stocks Real-Time (Via Relay)
    B->>R: Connect WSS + JWT token
    R->>R: Validate JWT
    R-->>B: Connection accepted
    B->>R: Subscribe ["AAPL", "TSLA", "MSFT"]
    R->>FH: Subscribe (if not already connected)
    loop Stock Stream
        FH-->>R: Trade update (raw Finnhub format)
        R-->>B: Forward trade data
        B->>B: Normalize to MarketUpdate
    end
```

### Flow 2: Portfolio Operations

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Hono API (Vercel)
    participant A as Better Auth
    participant PS as Portfolio Service
    participant DB as Supabase (Postgres)
    participant C as Cache Layer
    participant CG as CoinGecko REST

    Note over B,CG: Add Holding
    B->>H: POST /api/portfolio/holdings (RPC)
    H->>A: Validate session
    A-->>H: User authenticated
    H->>PS: addHolding(userId, { symbol, qty, costBasis })
    PS->>DB: INSERT INTO holding
    DB-->>PS: Created
    PS-->>B: Holding added

    Note over B,CG: View Portfolio P&L
    B->>H: GET /api/portfolio/:id/summary (RPC)
    H->>A: Validate session
    H->>DB: SELECT holdings WHERE portfolioId
    DB-->>H: Holdings list

    H->>C: Get current prices for holding symbols
    alt Prices cached
        C-->>H: Cached prices
    else Cache miss
        C->>CG: GET /simple/price?ids=bitcoin,ethereum
        CG-->>C: Current prices
        C-->>H: Prices
    end

    H->>PS: Calculate P&L (holdings × current prices - cost basis)
    PS-->>B: Portfolio summary with unrealized P&L
```

### Flow 3: Stablecoin Peg Monitor + Alert

```mermaid
sequenceDiagram
    participant BN as Binance (Direct WS)
    participant B as Browser
    participant H as Hono API (Vercel)
    participant DB as Supabase (Postgres)
    participant R as Resend (Email)

    Note over BN,R: Real-Time Peg Monitoring (Client-Side)
    BN-->>B: USDC/USDT ticker update ($0.9987)
    B->>B: Calculate deviation from $1.00 peg
    B->>B: Deviation = 0.13% — below threshold

    BN-->>B: USDC/USDT ticker update ($0.9934)
    B->>B: Calculate deviation from $1.00 peg
    B->>B: Deviation = 0.66% — ABOVE threshold (0.5%)
    B->>B: Show in-app alert

    Note over BN,R: Email Notification (via API)
    B->>H: POST /api/alerts/trigger (peg deviation detected)
    H->>DB: SELECT alert_rules WHERE symbol="USDC" AND condition="peg_deviation"
    DB-->>H: Users with active email alerts
    H->>R: Send email to each user
    R-->>H: Delivered
    H-->>B: Alert triggered
```

Note: Peg monitoring is now **client-side** since the browser already has the direct Binance stream. The browser detects deviations and notifies the API to send emails. This is simpler than having the relay detect it.

### Flow 4: Cross-Origin Auth (Finnhub Relay Only)

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Vercel (Hono + Better Auth)
    participant R as CF Durable Object (Finnhub Relay)
    participant DB as Supabase (Postgres)

    Note over B,DB: Step 1 — Login
    B->>V: POST /api/auth/sign-in (email + password)
    V->>DB: Verify credentials
    DB-->>V: User record
    V->>V: Create session + issue JWT
    V-->>B: Set session cookie + return JWT

    Note over B,DB: Step 2 — API Calls (Same Origin)
    B->>V: GET /api/portfolio (RPC)
    Note right of B: Session cookie sent automatically
    V->>V: Validate session via cookie
    V-->>B: Portfolio data

    Note over B,DB: Step 3 — Binance WS (No Auth Needed)
    B->>B: Connect directly to Binance
    Note right of B: No JWT, no backend — public API

    Note over B,DB: Step 4 — Finnhub Relay (Cross Origin)
    B->>R: WSS connect ?token=<jwt>
    R->>R: Decode JWT with shared signing secret
    alt Valid JWT
        R-->>B: 101 Switching Protocols (connected)
        B->>R: Subscribe to stock symbols
    else Invalid / Expired JWT
        R-->>B: Close 4001 (Unauthorized)
        B->>V: POST /api/auth/refresh
        V-->>B: New JWT
        B->>R: WSS reconnect ?token=<new_jwt>
    end
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : has
    USER ||--o{ PORTFOLIO : owns
    USER ||--o{ WATCHLIST : owns
    USER ||--o{ ALERT_RULE : configures
    PORTFOLIO ||--o{ HOLDING : contains
    WATCHLIST ||--o{ WATCHLIST_ITEM : contains

    USER {
        uuid id PK
        text email UK
        text name
        text image
        text region "us | global — for Binance API routing"
        timestamp createdAt
        timestamp updatedAt
    }

    SESSION {
        uuid id PK
        uuid userId FK
        text token UK
        timestamp expiresAt
    }

    ACCOUNT {
        uuid id PK
        uuid userId FK
        text provider "credential | google | github"
        text providerAccountId
    }

    PORTFOLIO {
        uuid id PK
        uuid userId FK
        text name
        timestamp createdAt
        timestamp updatedAt
    }

    HOLDING {
        uuid id PK
        uuid portfolioId FK
        text symbol "AAPL | BTC | ETH"
        enum assetType "stock | crypto"
        decimal quantity
        decimal avgCostBasis "avg price paid per unit"
        text currency "USD | EUR"
        timestamp addedAt
        timestamp updatedAt
    }

    WATCHLIST {
        uuid id PK
        uuid userId FK
        text name
        timestamp createdAt
    }

    WATCHLIST_ITEM {
        uuid id PK
        uuid watchlistId FK
        text symbol
        enum assetType "stock | crypto"
        timestamp addedAt
    }

    ALERT_RULE {
        uuid id PK
        uuid userId FK
        text symbol
        enum assetType "stock | crypto"
        enum condition "price_above | price_below | peg_deviation | correlation_shift"
        decimal threshold
        enum notifyVia "in_app | email"
        boolean active
        timestamp lastTriggeredAt
        timestamp createdAt
    }
```

---

## Unified Market Data Schema

Both Binance and Finnhub send data in different formats. The **client-side normalizer** transforms both into a single shape so the UI layer has one interface to work with.

```mermaid
graph TB
    subgraph Browser["Browser — Client-Side Normalization"]
        subgraph Raw["Raw Incoming Streams"]
            BN_RAW["Binance (direct WS)<br/>{e: 'trade', s: 'BTCUSDT',<br/>p: '42000.10', q: '0.001',<br/>T: 1711036800000}"]
            FH_RAW["Finnhub (via relay)<br/>{data: [{s: 'AAPL',<br/>p: 150.25, v: 100,<br/>t: 1711036800000}]}"]
        end

        subgraph Normalize["Normalizer Hook<br/>(use-market-stream.ts)"]
            MERGE["Transform + merge<br/>into unified type"]
        end

        subgraph Output["Unified Output"]
            MU["MarketUpdate<br/>{source, assetType, symbol,<br/>price, volume, timestamp,<br/>change24h?, high24h?, low24h?}"]
        end

        BN_RAW --> MERGE
        FH_RAW --> MERGE
        MERGE --> MU
    end

    subgraph UI["UI Components"]
        TICKER["Price Ticker"]
        CHART["Live Chart"]
        PORT["Portfolio P&L"]
        PEG["Peg Monitor"]
    end

    MU --> TICKER
    MU --> CHART
    MU --> PORT
    MU --> PEG
```

```typescript
type MarketUpdate = {
  source: 'finnhub' | 'binance'
  assetType: 'stock' | 'crypto'
  symbol: string          // normalized: "AAPL", "BTC/USDT"
  price: number
  volume: number
  timestamp: number       // unix ms
  change24h?: number
  high24h?: number
  low24h?: number
}
```

---

## Finnhub Relay — Internal Architecture

The relay is intentionally minimal. It does one thing: proxy Finnhub WebSocket data to authenticated browser clients while keeping the API key server-side.

```mermaid
graph TB
    subgraph Upstream["Upstream"]
        FH["Finnhub WS<br/>wss://ws.finnhub.io?token=API_KEY"]
    end

    subgraph Relay["Finnhub Relay (Cloudflare Durable Object)"]
        CM["Connection Manager<br/>• connect to Finnhub on startup<br/>• auto-reconnect on disconnect<br/>• health check endpoint"]
        SM["Subscription Manager<br/>• track client → symbols mapping<br/>• ref-count: subscribe upstream<br/>  only when first client needs symbol<br/>• unsubscribe upstream when<br/>  last client leaves symbol"]
        JWT["JWT Validator<br/>• shared signing secret with Vercel<br/>• validate on WS upgrade<br/>• extract userId"]
        BC["Broadcaster<br/>• fan-out: symbol update →<br/>  all clients subscribed to that symbol<br/>• drop messages if client<br/>  has backpressure"]
    end

    subgraph Clients["Authenticated Browser Clients"]
        C1["Client 1<br/>subs: AAPL, TSLA"]
        C2["Client 2<br/>subs: AAPL, MSFT"]
        C3["Client 3<br/>subs: GOOGL"]
    end

    FH -->|"trade data"| CM
    CM --> SM
    SM --> BC
    BC --> C1
    BC --> C2
    BC --> C3

    C1 -->|"WSS + JWT"| JWT
    C2 -->|"WSS + JWT"| JWT
    C3 -->|"WSS + JWT"| JWT

    C1 -->|"subscribe/unsubscribe"| SM
    C2 -->|"subscribe/unsubscribe"| SM
    C3 -->|"subscribe/unsubscribe"| SM
```

### Subscription Reference Counting

The relay only subscribes to Finnhub symbols that at least one client needs. This respects Finnhub's 50-symbol free tier limit.

```mermaid
graph LR
    subgraph Clients
        C1["Client 1: AAPL, TSLA"]
        C2["Client 2: AAPL, MSFT"]
    end

    subgraph RefCount["Symbol Ref Count"]
        AAPL["AAPL: 2 clients"]
        TSLA["TSLA: 1 client"]
        MSFT["MSFT: 1 client"]
    end

    subgraph Finnhub["Upstream Finnhub Subscriptions"]
        FH["Subscribed: AAPL, TSLA, MSFT<br/>(3 of 50 limit)"]
    end

    C1 --> AAPL
    C1 --> TSLA
    C2 --> AAPL
    C2 --> MSFT

    AAPL --> FH
    TSLA --> FH
    MSFT --> FH
```

When Client 1 disconnects: AAPL drops to 1 (stays subscribed), TSLA drops to 0 (unsubscribe upstream).

---

## Binance Direct Connection — Browser Architecture

No backend. The browser connects directly to Binance's public WebSocket streams.

```mermaid
graph TB
    subgraph Browser["Browser — use-binance-ws.ts"]
        INIT["Initialize WebSocket<br/>wss://stream.binance.com:9443/stream"]
        SUB["Send subscribe message<br/>{method: 'SUBSCRIBE',<br/>params: ['btcusdt@ticker',<br/>'ethusdt@ticker']}"]
        RECV["Receive stream data"]
        RECONN["Reconnection Logic<br/>• on close: reconnect with backoff<br/>• on 24hr: scheduled reconnect<br/>• on error: exponential backoff"]
        REGION["Region Check<br/>• global: stream.binance.com<br/>• us: stream.binance.us"]
    end

    subgraph Binance["Binance Public API"]
        WS["wss://stream.binance.com:9443<br/>or wss://stream.binance.us:9443"]
    end

    REGION --> INIT
    INIT --> SUB
    SUB --> WS
    WS -->|"ticker/trade data"| RECV
    RECV -->|"on disconnect"| RECONN
    RECONN --> INIT
```

### Reconnection Strategy

| Event | Action |
|-------|--------|
| Connection drops unexpectedly | Exponential backoff: 1s → 2s → 4s → 8s → max 30s |
| 24-hour expiry approaching | Pre-schedule reconnect at 23h 50m, resubscribe all streams |
| Network goes offline | Pause reconnection, resume when `navigator.onLine` fires |
| Tab becomes hidden | Optionally reduce subscription frequency or disconnect (saves resources) |

---

## Caching Architecture

```mermaid
graph TB
    subgraph Request["Incoming Request"]
        REQ["GET /api/market/coin/bitcoin"]
    end

    subgraph CacheLayer["Cache Layer (In-Memory Map + TTL)"]
        CHECK{"Cache key exists<br/>AND not expired?"}
        HIT["Return cached data"]
        MISS["Fetch from CoinGecko"]
        STORE["Store in cache<br/>with TTL"]
    end

    subgraph CoinGecko["CoinGecko REST"]
        CG["GET /coins/bitcoin"]
    end

    REQ --> CHECK
    CHECK -->|"HIT"| HIT
    CHECK -->|"MISS"| MISS
    MISS --> CG
    CG --> STORE
    STORE --> HIT
```

### TTL Configuration

| Data | Cache Key Pattern | TTL | Monthly Call Budget |
|------|------------------|-----|-------------------|
| Coin metadata | `coin:meta:{id}` | 24 hours | ~2,000 |
| Market rankings | `market:rankings:{page}` | 2 minutes | ~4,000 |
| Historical charts | `chart:{id}:{days}` | 10 minutes | ~2,000 |
| Trending coins | `trending` | 10 minutes | ~500 |
| Global market stats | `global` | 5 minutes | ~500 |
| Exchange rates | `exchange_rates` | 5 minutes | ~500 |
| Search results | `search:{query}` | 5 minutes | ~500 |
| **Total** | | | **~10,000** |

---

## Graceful Degradation Map

```mermaid
graph TB
    subgraph Failures["Failure Scenarios"]
        F1["Finnhub Relay Down<br/>(CF DO evicted)"]
        F2["CoinGecko Rate Limited"]
        F3["Binance WS Disconnects<br/>(24hr expiry)"]
        F4["Supabase Down"]
        F5["Finnhub Upstream<br/>Disconnects"]
    end

    subgraph Impact["User Impact"]
        I1["No stock real-time data"]
        I2["Metadata requests fail"]
        I3["Brief crypto data gap"]
        I4["Auth + portfolio unavailable"]
        I5["Relay loses upstream,<br/>clients get stale stock data"]
    end

    subgraph Mitigation["Mitigation"]
        M1["CF recreates DO on next request.<br/>Browser auto-reconnects.<br/>~100ms recovery. If persistent,<br/>fall back to Finnhub REST polling."]
        M2["Serve stale from cache.<br/>Show 'cached' indicator.<br/>Retry with exponential backoff."]
        M3["Browser auto-reconnects<br/>with exponential backoff.<br/>Pre-schedule at 23h 50m."]
        M4["Return 503 with clear error.<br/>Dashboard continues working<br/>(no DB needed for prices)."]
        M5["Relay auto-reconnects to<br/>Finnhub with backoff.<br/>Clients notified of stale state."]
    end

    F1 --> I1 --> M1
    F2 --> I2 --> M2
    F3 --> I3 --> M3
    F4 --> I4 --> M4
    F5 --> I5 --> M5
```

---

## Staged Implementation Plan

```mermaid
gantt
    title Owl — Staged Feature Delivery
    dateFormat X
    axisFormat Stage %s

    section Foundation
    Scaffold + Auth + DB            :s1, 1, 2
    section Market Data
    CoinGecko Integration + Dashboard :s2, 2, 3
    section Real-Time
    Binance Direct + Finnhub Relay  :s3, 3, 4
    section Portfolio
    Portfolio Tracker + P&L         :s4, 4, 5
    section Engagement
    Watchlists + Alerts             :s5, 5, 6
    section Stablecoin
    Peg Monitor                     :s6, 6, 7
    section Analytics
    Correlation Engine              :s7, 7, 8
    section Optimization
    Settlement Optimizer            :s8, 8, 9
```

| Stage | Feature | Key Deliverables |
|-------|---------|-----------------|
| **1** | Scaffold + Auth + DB | Next.js + Hono mounted, Better Auth (email/password), Drizzle schema + Supabase Postgres, base layout |
| **2** | Market Data + Dashboard | CoinGecko integration with caching, coin list + search, global stats, trending, coin detail with charts |
| **3** | Real-Time Prices | Browser direct to Binance WS, Finnhub relay on Cloudflare DO (lazy connection), client-side normalizer hook, live ticker, reconnection logic |
| **4** | Portfolio Tracker | CRUD portfolios/holdings, P&L calculation against live + cached prices, unified stock + crypto view |
| **5** | Watchlists + Alerts | Watchlist CRUD, alert rules, in-app notifications, email via Resend |
| **6** | Peg Monitor | USDC/USDT peg tracking (client-side via Binance stream), deviation alerts, historical peg chart |
| **7** | Correlation Engine | Cross-market correlation (BTC vs NASDAQ), correlation matrix, configurable time windows |
| **8** | Settlement Optimizer | Fiat vs stablecoin path comparison, real-time spreads, optimal path recommendation |

---

## Consequences

### Positive
- **Minimal backend surface area** — Cloudflare DO only runs Finnhub relay, not a full WS relay for both providers
- **No unnecessary middleware** — Binance data flows directly to the browser with zero latency overhead
- **No extra vendor dependencies** — no Ably/Pusher SDK, no message limits, no vendor risk
- **Type safety end-to-end** via Hono RPC
- **$0 relay infra cost** — Cloudflare DO free tier covers market-hours usage with margin
- **Each service independently testable** — Binance connection works without the relay, API works without either WS source
- **Strong interview narrative** — demonstrates targeted decision-making based on actual constraints, not over-engineering

### Negative
- **Two WebSocket connections in the browser** — slightly more client-side complexity, but manageable via hooks
- **Client-side normalization** — if the unified schema changes, it's a frontend deploy, not a backend-only change
- **Cross-origin auth still needed** for the Finnhub relay on CF DO (JWT validation)
- **In-memory cache on Vercel is lost on cold starts** — first request after cold start hits CoinGecko
- **Cloudflare DO platform lock-in** — relay uses DO-specific APIs (mitigated by documented Railway fallback in ADR-003)

### Risks
- **Binance geo-restriction** — blocked in US. Mitigation: region-aware routing to Binance.US (fewer pairs but same API shape)
- **Binance 24-hour WS expiry** — browser must handle scheduled reconnection
- **Finnhub 50-symbol limit** — shared across all connected clients via ref counting. Could be hit with many users watching different symbols
- **CoinGecko 10K monthly budget** — tight but manageable with proper TTLs. Misconfigured cache could exhaust it mid-month
- **Vercel function timeout (300s)** on hobby plan — correlation computation on large historical ranges may need precomputation
- **CF DO can be evicted anytime** — Cloudflare may restart DOs for infrastructure reasons. Reconnection logic handles this, but brief data gaps are possible

## Related Decisions
- [ADR-001: API Provider Selection](./001-api-provider-selection.md)
- [ADR-003: WebSocket Hosting Decision](./003-websocket-hosting.md) — Cloudflare DO selected over Railway, Fly.io, Render, and Ably
- ADR-004: Tech Stack Choices — pending
