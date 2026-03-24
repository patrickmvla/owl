import { db } from "@/server/db";
import { alertRule } from "@/server/db/schema";
import { eq, and, isNull, or, lt } from "drizzle-orm";
import { dispatchWebhook, buildWebhookPayload } from "./webhook-dispatcher";

/**
 * Alert evaluator — checks active alerts against current prices
 * and triggers notifications (webhook, in-app, email).
 *
 * Called from the API when the client detects a threshold crossing,
 * or could be called on a cron schedule.
 *
 * ADR-008: "Alert does not re-trigger within 5 minutes of last trigger"
 */

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface TriggerResult {
  ruleId: string;
  symbol: string;
  condition: string;
  notifyVia: string;
  webhookResult?: { success: boolean; statusCode?: number; error?: string };
}

export async function evaluateAndTrigger(
  symbol: string,
  currentPrice: number,
): Promise<TriggerResult[]> {
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_MS);

  // Find active rules for this symbol that haven't triggered recently
  const rules = await db
    .select()
    .from(alertRule)
    .where(
      and(
        eq(alertRule.symbol, symbol.toUpperCase()),
        eq(alertRule.active, true),
        or(
          isNull(alertRule.lastTriggeredAt),
          lt(alertRule.lastTriggeredAt, cooldownCutoff),
        ),
      ),
    );

  const results: TriggerResult[] = [];

  for (const rule of rules) {
    const threshold = parseFloat(rule.threshold);
    let shouldTrigger = false;

    switch (rule.condition) {
      case "price_above":
        shouldTrigger = currentPrice >= threshold;
        break;
      case "price_below":
        shouldTrigger = currentPrice <= threshold;
        break;
      case "peg_deviation": {
        const deviation = Math.abs((currentPrice - 1.0) / 1.0) * 100;
        shouldTrigger = deviation >= threshold;
        break;
      }
    }

    if (!shouldTrigger) continue;

    // Update lastTriggeredAt
    await db
      .update(alertRule)
      .set({ lastTriggeredAt: now })
      .where(eq(alertRule.id, rule.id));

    const result: TriggerResult = {
      ruleId: rule.id,
      symbol: rule.symbol,
      condition: rule.condition,
      notifyVia: rule.notifyVia,
    };

    // Dispatch webhook if configured
    if (rule.notifyVia === "webhook" && rule.webhookUrl && rule.webhookSecret) {
      const payload = buildWebhookPayload(
        rule.condition,
        rule.symbol,
        currentPrice,
        threshold,
      );
      result.webhookResult = await dispatchWebhook(
        rule.webhookUrl,
        rule.webhookSecret,
        payload,
      );
    }

    results.push(result);
  }

  return results;
}
