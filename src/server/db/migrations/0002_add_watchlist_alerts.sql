-- Stage 5: Watchlist + Alert tables

CREATE TYPE "public"."alert_condition" AS ENUM('price_above', 'price_below', 'peg_deviation');
CREATE TYPE "public"."notify_channel" AS ENUM('in_app', 'email', 'webhook');

CREATE TABLE "watchlist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "name" text DEFAULT 'My Watchlist' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "watchlist_item" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "watchlist_id" uuid NOT NULL,
  "symbol" text NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "added_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "alert_rule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "symbol" text NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "condition" "alert_condition" NOT NULL,
  "threshold" numeric(20, 8) NOT NULL,
  "notify_via" "notify_channel" DEFAULT 'in_app' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "last_triggered_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "watchlist_item" ADD CONSTRAINT "watchlist_item_watchlist_id_watchlist_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlist"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "alert_rule" ADD CONSTRAINT "alert_rule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
