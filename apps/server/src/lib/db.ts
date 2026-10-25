import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../db/schema.js";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/nzoai";

export const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
