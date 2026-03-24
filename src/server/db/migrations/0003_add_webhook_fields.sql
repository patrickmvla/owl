-- Stage 10: Add webhook URL and secret to alert_rule
ALTER TABLE "alert_rule" ADD COLUMN "webhook_url" text;
ALTER TABLE "alert_rule" ADD COLUMN "webhook_secret" text;
