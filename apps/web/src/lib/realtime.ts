import { createRealtime, rawSql } from "@neon/realtime/server";

const secret = process.env.NEON_REALTIME_SECRET || "";
const dbName = "neondb";

export const realtimeServer = secret
  ? createRealtime({
      secret,
      db: dbName,
    })
  : null;

export { rawSql };
