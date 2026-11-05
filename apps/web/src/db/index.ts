import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded regardless of current working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const { Pool } = pg;

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "postgres://postgres:postgres@localhost:5432/nzoai";

const isNeon = rawConnectionString.includes("neon.tech");

// Strip channel_binding=require and sslmode=require from URL when using explicit ssl config
// so pg-connection-string does not override rejectUnauthorized or stall on PgBouncer poolers
const connectionString = isNeon
  ? rawConnectionString
      .replace(/[?&]channel_binding=[^&]+/g, "")
      .replace(/[?&]sslmode=[^&]+/g, "")
      .replace(/\?&/, "?")
      .replace(/\?$/, "")
  : rawConnectionString;

export const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  max: 15,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.warn("[db pool] Idle client connection reset (will reconnect automatically):", err.message);
});

export const db = drizzle(pool, { schema });
export * from "./schema";
