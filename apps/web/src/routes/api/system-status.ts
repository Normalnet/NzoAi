import { createServerFileRoute } from "@/lib/server-route";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getStorageClient, BUCKET_NAME } from "@/lib/storage";

export const ServerRoute = createServerFileRoute("/api/system-status").methods({
  GET: async () => {
    const serverUrl = process.env.SERVER_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);
    let serverReachable = false;
    let serverHealthData: any = null;

    let dbConnected = false;
    let dbError: string | null = null;

    const neonFunctionUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
    let neonFunctionReachable = false;
    let neonFunctionData: any = null;

    // Run all 3 external health checks in parallel with fast 1500ms timeouts
    await Promise.all([
      (async () => {
        if (!serverUrl) return;
        try {
          const res = await fetch(new URL("/api/health", serverUrl), {
            signal: AbortSignal.timeout(1500),
          });
          if (res.ok) {
            serverHealthData = await res.json();
            serverReachable = true;
          }
        } catch (err: any) {
          serverHealthData = { error: err.message };
        }
      })(),
      (async () => {
        try {
          await db.execute(sql`SELECT 1`);
          dbConnected = true;
        } catch (err: any) {
          dbError = err.message;
        }
      })(),
      (async () => {
        if (!neonFunctionUrl) return;
        try {
          const res = await fetch(neonFunctionUrl, {
            signal: AbortSignal.timeout(1500),
          });
          if (res.ok) {
            neonFunctionData = await res.text();
            neonFunctionReachable = true;
          } else {
            neonFunctionData = { status: res.status, statusText: res.statusText };
          }
        } catch (err: any) {
          neonFunctionData = { error: err.message };
        }
      })(),
    ]);

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
