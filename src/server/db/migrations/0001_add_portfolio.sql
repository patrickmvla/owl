-- Stage 4: Portfolio + Holding tables

CREATE TYPE "public"."asset_type" AS ENUM('stock', 'crypto');

CREATE TABLE "portfolio" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "holding" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "portfolio_id" uuid NOT NULL,
  "symbol" text NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "quantity" numeric(20, 8) NOT NULL,
  "avg_cost_basis" numeric(20, 8) NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "added_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "holding" ADD CONSTRAINT "holding_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
