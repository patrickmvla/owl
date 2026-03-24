import { createHmac } from "crypto";

/**
 * Webhook dispatcher — sends HMAC-signed POST to configured URLs.
 *
 * ADR-004: "Webhooks are for systems. A trading bot or payment processor
 * needs programmatic notification of peg deviations — not an email."
 *
 * Payload is signed with HMAC-SHA256 using the alert rule's webhook_secret.
 * The signature is sent in the X-Owl-Signature header.
 */

export interface WebhookPayload {
  event: string; // "price.above" | "price.below" | "peg.deviation"
  data: {
    symbol: string;
    price: number;
    threshold: number;
    condition: string;
    timestamp: number;
  };
}

/**
 * Sign a payload with HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Dispatch a webhook with retry logic.
 * 3 attempts with exponential backoff (1s, 2s, 4s).
 */
export async function dispatchWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Owl-Signature": signature,
          "X-Owl-Event": payload.event,
          "User-Agent": "Owl/1.0",
        },
        body,
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (res.ok || res.status < 500) {
        // 2xx = success, 4xx = client error (don't retry)
        return { success: res.ok, statusCode: res.status };
      }

      // 5xx — retry after backoff
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    } catch (err) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      } else {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * Build webhook payload from alert trigger data.
 */
export function buildWebhookPayload(
  condition: string,
  symbol: string,
  price: number,
  threshold: number,
): WebhookPayload {
  const eventMap: Record<string, string> = {
    price_above: "price.above",
    price_below: "price.below",
    peg_deviation: "peg.deviation",
  };

  return {
    event: eventMap[condition] ?? condition,
    data: {
      symbol,
      price,
      threshold,
      condition,
      timestamp: Date.now(),
    },
  };
}
