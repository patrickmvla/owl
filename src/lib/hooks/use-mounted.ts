"use client";

import { useState, useEffect } from "react";

/**
 * Returns true only after the component has mounted on the client.
 *
 * Use this to prevent hydration mismatches in components that read
 * from client-only stores (Zustand, localStorage, WebSocket data).
 * The server renders the fallback, the client renders the real content.
 *
 * Pattern: if (!mounted) return <Skeleton />
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
