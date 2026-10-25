import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

async function runMigrations() {
  console.log("[db] Running migrations...");
  try {
    // Ensure pgvector extension exists
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[db] Migrations applied successfully!");
  } catch (error) {
    console.error("[db] Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
