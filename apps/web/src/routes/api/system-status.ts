import { createServerFileRoute } from "@/lib/server-route";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getStorageClient, BUCKET_NAME } from "@/lib/storage";

export const ServerRoute = createServerFileRoute("/api/system-status").methods({
  GET: async () => {
    // 1. WebSocket / Realtime Server status
    const serverUrl = process.env.SERVER_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);
    let serverReachable = false;
    let serverHealthData = null;

    if (serverUrl) {
      try {
        const res = await fetch(new URL("/api/health", serverUrl));
        if (res.ok) {
          serverHealthData = await res.json();
          serverReachable = true;
        }
      } catch (err: any) {
        serverHealthData = { error: err.message };
      }
    }

    // 2. Lakebase Postgres status
    let dbConnected = false;
    let dbError = null;
    try {
      await db.execute(sql`SELECT 1`);
      dbConnected = true;
    } catch (err: any) {
      dbError = err.message;
    }

    // 3. Neon Function status
    const neonFunctionUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
    let neonFunctionReachable = false;
    let neonFunctionData: any = null;
    if (neonFunctionUrl) {
      try {
        const res = await fetch(neonFunctionUrl);
        if (res.ok) {
          neonFunctionData = await res.text();
          neonFunctionReachable = true;
        } else {
          neonFunctionData = { status: res.status, statusText: res.statusText };
        }
      } catch (err: any) {
        neonFunctionData = { error: err.message };
      }
    }

    // 4. Neon Object Storage
    const storageClient = getStorageClient();
    const objectStorageConfigured = Boolean(storageClient);

    // 5. Neon Auth
    const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
    const neonAuthConfigured = Boolean(neonAuthBaseUrl);

    // 6. Neon Realtime
    const neonRealtimeUrl = process.env.NEON_REALTIME_URL;
    const neonRealtimeConfigured = Boolean(neonRealtimeUrl);

    return new Response(
      JSON.stringify({
        status: "ok",
        services: {
          web: { status: "healthy" },
          server: {
            reachable: serverReachable,
            boundUrlProvided: Boolean(process.env.SERVER_URL),
            details: serverHealthData,
          },
          neon: {
            postgres: { connected: dbConnected, error: dbError },
            functions: {
              configured: Boolean(neonFunctionUrl),
              reachable: neonFunctionReachable,
              url: neonFunctionUrl,
              response: neonFunctionData,
            },
            objectStorage: {
              configured: objectStorageConfigured,
              bucket: BUCKET_NAME,
              endpoint: process.env.AWS_ENDPOINT_URL_S3,
            },
            auth: {
              configured: neonAuthConfigured,
              baseUrl: neonAuthBaseUrl,
            },
            realtime: {
              configured: neonRealtimeConfigured,
              url: neonRealtimeUrl,
            },
          },
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});
