"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp, ColorType, AreaSeries } from "lightweight-charts";
import { useMarketChart } from "../hooks/use-market-chart";

interface PriceChartProps {
  coinId: string;
  days?: string;
}

export function PriceChart({ coinId, days = "30" }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const { data: chartData, isLoading } = useMarketChart(coinId, "usd", days);

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#787b86",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        attributionLogo: false, // attribution via link in footer instead
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

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#26a69a",
      topColor: "rgba(38, 166, 154, 0.2)",
      bottomColor: "rgba(38, 166, 154, 0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

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
      seriesRef.current = null;
    };
  }, []);

  // Update data whenever chartData changes
  useEffect(() => {
    if (!seriesRef.current || !chartData?.prices?.length) return;

    const seriesData = chartData.prices.map(([time, value]) => ({
      time: Math.floor(time / 1000) as UTCTimestamp,
      value,
    }));

    seriesRef.current.setData(seriesData);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  return (
    <div className="relative h-[400px] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <span className="text-xs text-muted-foreground">Loading chart...</span>
        </div>
      )}
    </div>
  );
}
