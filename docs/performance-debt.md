# Performance Debt — ADR-005 Compliance Audit

**Date:** 2026-03-22
**Severity:** High — violates core architectural principles
**Blocked by:** Nothing — this is a refactor, not a feature

## Context

ADR-005 defines 6 performance principles. After building Stages 1–7, we've accumulated significant drift from these principles. This document tracks the violations and the remediation plan.

## Violations

### 1. Server-First Rendering (CRITICAL)

**Principle:** "Every component defaults to a Server Component. `'use client'` is only added when a component needs interactivity."

**Reality:** Almost every component is a Client Component. Pages import `'use client'` components directly, forcing the entire tree client-side.

**What should be Server Components:**
- Page shells (`page.tsx` files) — these are already Server Components but they import Client Components that could be split
- Stats grids (market cap, volume, supply) — static data, no interactivity
- Coin descriptions and metadata sections
- Navigation labels, section headers
- Table headers
- The settings page profile section (read-only data display)

**What must stay Client Components:**
- `PriceDisplay` (WebSocket subscription)
- `PriceChart` (Lightweight Charts, canvas)
- `MarketStream` (WebSocket connection manager)
- Form components (inputs, dialogs, selects)
- `IconRail` (usePathname for active state)
- `StatusStrip` (live price subscription)
- Any component using `useQuery`, `usePrice`, `useState`

**Refactor pattern:**
```tsx
// BEFORE: entire component is client
"use client";
export function CoinDetail({ coinId }) {
  const { data } = useCoinDetail(coinId);
  return (
    <div>
      <StaticHeader coin={data} />       {/* doesn't need client */}
      <PriceChart coinId={coinId} />      {/* needs client */}
      <StatsGrid coin={data} />           {/* doesn't need client */}
      <Description text={data.desc} />    {/* doesn't need client */}
    </div>
  );
}

// AFTER: Server Component page with client islands
// page.tsx (Server Component)
export default async function CoinDetailPage({ params }) {
  const coin = await getCoinDetail(params.id); // server-side fetch
  return (
    <div>
      <StaticHeader coin={coin} />                    {/* Server Component */}
      <PriceChartClient coinId={params.id} />          {/* Client island */}
      <StatsGrid coin={coin} />                        {/* Server Component */}
      <Description text={coin.description.en} />       {/* Server Component */}
    </div>
  );
}
```

**Files to refactor:**
- `src/app/(dashboard)/page.tsx` — fetch data server-side, pass to client islands
- `src/features/market/components/coin-detail.tsx` — split into server shell + client islands
- `src/features/market/components/market-explorer.tsx` — search is client, table can be server with client price cells
- `src/features/market/components/global-stats.tsx` — fetch server-side, render as HTML
- `src/features/peg/components/peg-dashboard.tsx` — cards can be server, chart is client
- `src/features/portfolio/components/holdings-table.tsx` — table layout is server, P&L cells are client
- `src/features/auth/components/settings-view.tsx` — profile section is server

### 2. Streaming / Partial Prerendering (HIGH)

**Principle:** "The dashboard page shell is pre-rendered at the edge. Dynamic content streams in after the shell loads."

**Reality:** Zero `Suspense` boundaries. No streaming. The user sees nothing until all data loads.

**Remediation:**
- Wrap data-dependent sections in `<Suspense fallback={<Skeleton />}>`
- The dashboard shell (icon rail, layout, status strip, section headers) should render instantly
- Market data, portfolio P&L, peg status stream in progressively
- Each section becomes independently loadable

**Example:**
```tsx
// Dashboard page with streaming
export default function DashboardPage() {
  return (
    <div className="space-y-4 p-6">
      <Suspense fallback={<StatsSkeletons />}>
        <PersonalCommandBar />
      </Suspense>

      <Suspense fallback={<GlobalStatsSkeleton />}>
        <GlobalStats />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <MarketContent />
      </Suspense>
    </div>
  );
}
```

### 3. Hot Path Optimization (MEDIUM)

**Principle:** "The real-time hot path bypasses React."

**Reality:** `PriceDisplay` correctly uses `useRef` + direct DOM mutation. But other components (WatchlistMoversMini, PortfolioSnapshot, StatusStrip) re-render through React on every price tick via `usePriceVersion()`.

**Remediation:**
- Audit every component using `usePriceVersion()` — can it use `useRef` instead?
- Portfolio total value updating 50x/sec via React re-renders is wasteful — use `useRef` pattern
- WatchlistMoversMini re-renders all 4 items when any price changes — should use per-symbol subscription

### 4. Bundle Analysis (MEDIUM)

**Principle:** "No performance claim is accepted without measurement."

**Reality:** No bundle analysis has been run. We don't know if we're under the 250KB gzipped budget.

**Remediation:**
- Install `@next/bundle-analyzer`
- Run `ANALYZE=true bun run build` and review
- Identify unexpected large chunks
- Verify tree-shaking is working (Phosphor Icons, Radix primitives)

### 5. Web Vitals Monitoring (LOW — pre-deployment)

**Principle:** "Lighthouse CI in the deployment pipeline. Web Vitals monitoring in production."

**Reality:** Not set up. Acceptable pre-deployment but must be added before Stage 9 (public API).

**Remediation:**
- Add `@vercel/analytics` to layout
- Add Lighthouse CI to GitHub Actions
- Set performance gates: LCP ≤ 2.5s, INP ≤ 200ms, CLS = 0

---

## Remediation — Stage 7.5 Progress

### Completed
- [x] Suspense boundaries on dashboard (each section streams independently)
- [x] `loading.tsx` for dashboard, market, coin detail routes (instant prefetched navigation)
- [x] `@vercel/analytics` added to root layout (Web Vitals in production)
- [x] `@next/bundle-analyzer` installed + `bun run analyze` script
- [x] `GlobalStats` → Server Component (async, fetches directly, zero JS)
- [x] `TrendingList` → Server Component (async, fetches directly, zero JS)
- [x] Coin detail page split: Server Component page renders stats/description/links as HTML, client islands for header (live price, watchlist) and chart (Lightweight Charts)

### Remaining (deferred)
- [ ] `cacheComponents: true` (PPR) — blocked by `usePathname()` in icon rail layout
- [ ] Hot path audit — expand `useRef` pattern to PortfolioSnapshot, WatchlistMoversMini
- [ ] Bundle analysis — run `bun run analyze` and optimize any oversized chunks

**Why before Stage 8:** The settlement optimizer (Stage 8) will add more pages. Refactoring after Stage 8 means more files to touch. The performance debt compounds — fix it before it grows.
