import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/system-status").methods({
  GET: async () => {
    // Read the bound internal URL for the server service
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
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});
