import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

// ============================================
// Auth tables (managed by Better Auth)
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  region: text("region").notNull().default("global"), // "us" | "global" — for Binance API routing
  preferredCurrency: text("preferred_currency").notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Audit log (ADR-004 — request logging)
// ============================================

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "auth.sign_in", "portfolio.create", etc.
  resource: text("resource"), // "/api/v0/portfolio/123"
  method: text("method"), // "GET", "POST", etc.
  statusCode: integer("status_code"),
  ipHash: text("ip_hash"), // hashed, never plaintext (ADR-004)
  metadata: text("metadata"), // JSON string for extra context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Enums
// ============================================

export const assetTypeEnum = pgEnum("asset_type", ["stock", "crypto"]);

// ============================================
// Portfolio (Stage 4)
// ============================================

export const portfolio = pgTable("portfolio", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const holding = pgTable("holding", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(), // "BTC", "AAPL", "ETH"
  assetType: assetTypeEnum("asset_type").notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(), // supports crypto decimals
  avgCostBasis: numeric("avg_cost_basis", { precision: 20, scale: 8 }).notNull(), // avg price paid per unit
  currency: text("currency").notNull().default("USD"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Watchlist (Stage 5)
// ============================================

export const watchlist = pgTable("watchlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Watchlist"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const watchlistItem = pgTable("watchlist_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchlistId: uuid("watchlist_id")
    .notNull()
    .references(() => watchlist.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  assetType: assetTypeEnum("asset_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// ============================================
// Alerts (Stage 5)
// ============================================

export const alertConditionEnum = pgEnum("alert_condition", [
  "price_above",
  "price_below",
  "peg_deviation",
]);

export const notifyChannelEnum = pgEnum("notify_channel", [
  "in_app",
  "email",
  "webhook",
]);

export const alertRule = pgTable("alert_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  assetType: assetTypeEnum("asset_type").notNull(),
  condition: alertConditionEnum("condition").notNull(),
  threshold: numeric("threshold", { precision: 20, scale: 8 }).notNull(),
  notifyVia: notifyChannelEnum("notify_via").notNull().default("in_app"),
  active: boolean("active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Stage 6+ tables will be added in their
// respective stages.
// ============================================
