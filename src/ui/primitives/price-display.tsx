"use client";

import { useEffect, useRef } from "react";
import { usePrice } from "@/features/real-time/stores/price-store";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  symbol: string;
  fallbackPrice?: number;
  currency?: string;
  className?: string;
  showFlash?: boolean;
}

/**
 * Displays a live price with flash animation on change.
 *
 * Uses the useRef + direct DOM escape hatch from ADR-005:
 * "For the most latency-sensitive updates (price cells updating
 * 50 times/sec), the correct pattern is useRef + direct DOM
 * textContent mutation."
 *
 * React handles mount/unmount. The browser handles the
 * frame-by-frame number update.
 */
export function PriceDisplay({
  symbol,
  fallbackPrice,
  currency = "USD",
  className,
  showFlash = true,
}: PriceDisplayProps) {
  const priceRef = useRef<HTMLSpanElement>(null);
  const prevPriceRef = useRef<number | null>(null);
  const update = usePrice(symbol);
  const price = update?.price ?? fallbackPrice ?? 0;

  useEffect(() => {
    if (!priceRef.current) return;

    // Update text content directly — no React re-render
    priceRef.current.textContent = formatPrice(price, currency);

    // Flash animation
    if (showFlash && prevPriceRef.current !== null && prevPriceRef.current !== price) {
      const direction = price > prevPriceRef.current ? "flash-up" : "flash-down";

      // Remove previous flash class if still animating
      priceRef.current.classList.remove("flash-up", "flash-down");
      // Force reflow to restart animation
      void priceRef.current.offsetWidth;
      priceRef.current.classList.add(direction);
    }

    prevPriceRef.current = price;
  }, [price, currency, showFlash]);

  return (
    <span
      ref={priceRef}
      className={cn("tabular-nums", className)}
    >
      {formatPrice(price, currency)}
    </span>
  );
}
