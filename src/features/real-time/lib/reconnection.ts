const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

/**
 * Exponential backoff with jitter for WebSocket reconnection.
 * 1s → 2s → 4s → 8s → 16s → 30s (capped)
 *
 * ADR-003/007: reconnection logic required regardless of host.
 */
export function getBackoffDelay(attempt: number): number {
  const exponential = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY);
  // Add ±20% jitter to prevent thundering herd
  const jitter = exponential * (0.8 + Math.random() * 0.4);
  return Math.floor(jitter);
}

/**
 * Creates a managed reconnection controller.
 * Handles backoff, online/offline detection, and reset on success.
 */
export function createReconnection(
  connect: () => void,
  onStatusChange?: (status: "connecting" | "connected" | "disconnected") => void,
) {
  let attempt = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function scheduleReconnect() {
    if (destroyed) return;

    const delay = getBackoffDelay(attempt);
    onStatusChange?.("disconnected");

    timeoutId = setTimeout(() => {
      if (destroyed) return;
      attempt++;
      onStatusChange?.("connecting");
      connect();
    }, delay);
  }

  function onConnected() {
    attempt = 0;
    onStatusChange?.("connected");
  }

  function onDisconnected() {
    scheduleReconnect();
  }

  function destroy() {
    destroyed = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function reset() {
    attempt = 0;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  return { onConnected, onDisconnected, destroy, reset };
}
