"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeBinanceTicker } from "../lib/normalizer";
import { queueUpdate } from "../lib/batcher";
import { createReconnection } from "../lib/reconnection";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * Direct browser WebSocket to Binance public streams.
 * No auth needed — public API. No backend relay.
 *
 * ADR-002: "Binance public WebSocket requires no auth —
 * browsers can connect directly"
 *
 * ADR-003: "Browser connects directly to Binance (no backend).
 * A minimal relay on Railway/CF DO proxies only Finnhub."
 */
export function useBinanceWs(symbols: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectionRef = useRef<ReturnType<typeof createReconnection> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (symbols.length === 0) return;

    // Convert symbols to Binance stream format
    // "BTC/USDT" → "btcusdt@miniTicker"
    const streams = symbols
      .map((s) => s.replace("/", "").toLowerCase() + "@miniTicker")
      .join("/");

    const baseUrl = "wss://stream.binance.com:9443/stream";

    function connect() {
      // Clean up previous connection
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnection trigger
        wsRef.current.close();
      }

      const ws = new WebSocket(`${baseUrl}?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectionRef.current?.onConnected();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.data?.e === "24hrMiniTicker") {
            const update = normalizeBinanceTicker(msg.data);
            queueUpdate(update);
          }
        } catch {
          // Malformed message — skip silently
        }
      };

      ws.onclose = () => {
        reconnectionRef.current?.onDisconnected();
      };

      ws.onerror = () => {
        // onerror is always followed by onclose — let onclose handle reconnection
      };
    }

    const reconnection = createReconnection(connect, setStatus);
    reconnectionRef.current = reconnection;

    // Initial connection
    setStatus("connecting");
    connect();

    return () => {
      reconnection.destroy();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbols.join(",")]); // reconnect when symbol list changes

  return { status };
}
