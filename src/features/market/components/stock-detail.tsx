"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, CandlestickSeries } from "lightweight-charts";
import { useStockQuote, useStockProfile, useStockCandles } from "../hooks/use-stock-quote";
import { formatPrice, formatPercent, formatCompact, formatNumber } from "@/lib/utils/format";

const TIME_RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
] as const;

export function StockDetail({ symbol }: { symbol: string }) {
  const [days, setDays] = useState(90);
  const { data: quote } = useStockQuote(symbol);
  const { data: profile } = useStockProfile(symbol);
  const { data: candles } = useStockCandles(symbol, days);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  /**
   * Ref callback — creates the chart when the DOM node mounts.
   * This is the React-recommended way to sync with an external system
   * (canvas/DOM library) without useEffect.
   * See: https://react.dev/learn/you-might-not-need-an-effect
   */
  const chartContainerRef = (node: HTMLDivElement | null) => {
    // Cleanup previous chart if node is removed
    if (!node) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
      return;
    }

    // Don't recreate if chart already exists on this node
    if (chartRef.current) return;

    const chart = createChart(node, {
      width: node.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#787b86",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.08)" },
      timeScale: { borderColor: "rgba(255, 255, 255, 0.08)", timeVisible: true },
      crosshair: {
        vertLine: { color: "rgba(255, 255, 255, 0.2)" },
        horzLine: { color: "rgba(255, 255, 255, 0.2)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: node.clientWidth });
    });
    observer.observe(node);
  };

  // Sync candle data to the chart — this IS a valid effect
  // (synchronizing external system state with React state)
  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return;

    seriesRef.current.setData(
      candles.map((c: any) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const isPositive = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <Link href="/market" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        {profile?.logo && (
          <img src={profile.logo} alt={profile.name} width={24} height={24} className="rounded-sm" />
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{profile?.name ?? symbol}</span>
          <span className="text-xs text-muted-foreground">{symbol}</span>
          {profile?.finnhubIndustry && (
            <span className="text-[10px] text-muted-foreground">{profile.finnhubIndustry}</span>
          )}
        </div>
        <div className="flex items-baseline gap-2 ml-auto">
          <span className="text-xl font-semibold tabular-nums">
            {quote ? formatPrice(quote.price) : "—"}
          </span>
          {quote && (
            <span className={`text-xs tabular-nums ${isPositive ? "price-up" : "price-down"}`}>
              {isPositive ? "+" : ""}{formatPrice(quote.change)} ({formatPercent(quote.changePercent)})
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Chart */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 mb-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setDays(range.days)}
                className={`px-2.5 py-1 text-xs tabular-nums transition-colors ${
                  days === range.days
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div ref={chartContainerRef} className="h-[400px] w-full" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px border-t border-border mt-4 bg-border lg:grid-cols-4">
          {[
            { label: "MKT CAP", value: profile?.marketCapitalization ? formatCompact(profile.marketCapitalization * 1_000_000) : "—" },
            { label: "DAY HIGH", value: quote ? formatPrice(quote.high) : "—" },
            { label: "DAY LOW", value: quote ? formatPrice(quote.low) : "—" },
            { label: "PREV CLOSE", value: quote ? formatPrice(quote.previousClose) : "—" },
            { label: "OPEN", value: quote ? formatPrice(quote.open) : "—" },
            { label: "SHARES OUT", value: profile?.shareOutstanding ? `${formatNumber(profile.shareOutstanding, 1)}M` : "—" },
            { label: "EXCHANGE", value: profile?.exchange ?? "—" },
            { label: "IPO", value: profile?.ipo ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-3 space-y-0.5">
              <span className="label-micro">{stat.label}</span>
              <div className="text-xs font-medium tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Links */}
        {profile?.weburl && (
          <div className="px-6 py-4">
            <a
              href={profile.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowSquareOut size={12} />
              {profile.weburl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          </div>
        )}

        <div className="px-6 pb-4 text-[10px] text-muted-foreground/60">
          Stock data from Finnhub (quote, profile) + Yahoo Finance (historical charts). Quotes may be delayed ~15 minutes on free tier.
        </div>
      </div>
    </div>
  );
}
