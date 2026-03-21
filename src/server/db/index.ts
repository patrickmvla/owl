import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString, {
  prepare: false, // required for Supabase connection pooler (Supavisor)
});

export const db = drizzle({ client, schema, casing: "snake_case" });
