"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, LineSeries } from "lightweight-charts";
import { usePegHistory } from "../hooks/use-peg-history";

const SERIES_COLORS = [
  "#26a69a", // USDC — teal
  "#42a5f5", // USDT — blue
  "#ab47bc", // DAI — purple
  "#ef5350", // EURC — red
  "#ffa726", // PYUSD — orange
  "#66bb6a", // FDUSD — green
  "#78909c", // TUSD — gray
];

const TIME_RANGES = ["1", "7", "30"] as const;
const TIME_LABELS: Record<string, string> = { "1": "1D", "7": "7D", "30": "30D" };

export function DeviationChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);
  const [days, setDays] = useState("7");
  const { data: history, isLoading } = usePegHistory(days);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#787b86",
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(255, 255, 255, 0.2)" },
        horzLine: { color: "rgba(255, 255, 255, 0.2)" },
      },
    });

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, []);

  // Update data when history changes
  useEffect(() => {
    if (!chartRef.current || !history) return;

    // Remove old series
    for (const s of seriesRefs.current) {
      chartRef.current.removeSeries(s);
    }
    seriesRefs.current = [];

    // Add series per stablecoin
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      if (!h || h.points.length === 0) continue;

      const seriesColor = SERIES_COLORS[i % SERIES_COLORS.length] ?? "#787b86";
      const series = chartRef.current.addSeries(LineSeries, {
        color: seriesColor,
        lineWidth: 2,
        title: "", // legend is rendered separately below the chart
        lastValueVisible: false, // prevents label cramming on right side
        priceLineVisible: false, // no horizontal price lines
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: "custom",
          formatter: (price: number) => `${price.toFixed(3)}%`,
        },
      });

      series.setData(
        h.points.map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
        })),
      );

      seriesRefs.current.push(series);
    }

    chartRef.current.timeScale().fitContent();
  }, [history]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label-micro">Deviation History</span>
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={`px-2 py-0.5 text-[10px] tabular-nums transition-colors ${
                days === range
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TIME_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[280px] w-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-xs text-muted-foreground">Loading history...</span>
          </div>
        )}
      </div>

      {/* Legend */}
      {history && (
        <div className="flex flex-wrap gap-3">
          {history.map((h, i) => (
            h.points.length > 0 && (
              <span key={h.symbol} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                {h.symbol}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}
