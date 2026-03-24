import { db } from "@/server/db";
import { alertRule } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAlertRules(userId: string) {
  return db
    .select()
    .from(alertRule)
    .where(eq(alertRule.userId, userId))
    .orderBy(alertRule.createdAt);
}

export async function createAlertRule(
  userId: string,
  data: {
    symbol: string;
    asset_type: "stock" | "crypto";
    condition: "price_above" | "price_below" | "peg_deviation";
    threshold: string;
    notify_via?: "in_app" | "email" | "webhook" | undefined;
    webhook_url?: string | undefined;
    webhook_secret?: string | undefined;
  },
) {
  const values: Record<string, unknown> = {
    userId,
    symbol: data.symbol.toUpperCase(),
    assetType: data.asset_type,
    condition: data.condition,
    threshold: data.threshold,
  };

  if (data.notify_via != null) {
    values.notifyVia = data.notify_via;
  }
  if (data.webhook_url != null) {
    values.webhookUrl = data.webhook_url;
  }
  if (data.webhook_secret != null) {
    values.webhookSecret = data.webhook_secret;
  }

  const [result] = await db
    .insert(alertRule)
    .values(values as typeof alertRule.$inferInsert)
    .returning();
  return result;
}

export async function toggleAlertRule(userId: string, ruleId: string, active: boolean) {
  const [result] = await db
    .update(alertRule)
    .set({ active })
    .where(and(eq(alertRule.id, ruleId), eq(alertRule.userId, userId)))
    .returning();
  return result;
}

export async function deleteAlertRule(userId: string, ruleId: string) {
  const [result] = await db
    .delete(alertRule)
    .where(and(eq(alertRule.id, ruleId), eq(alertRule.userId, userId)))
    .returning();
  return result;
}
