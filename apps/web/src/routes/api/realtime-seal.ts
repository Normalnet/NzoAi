import { createServerFileRoute } from "@/lib/server-route";
import { realtimeServer, rawSql } from "@/lib/realtime";

export const ServerRoute = createServerFileRoute("/api/realtime-seal").methods({
  GET: async () => {
    if (!realtimeServer) {
      return new Response(JSON.stringify({ error: "NEON_REALTIME_SECRET is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Seal a live query for active chatbots
      const query = rawSql(`SELECT id, name, "organizationId", "primaryColor" FROM chatbot ORDER BY "createdAt" DESC LIMIT 10`);
      const sealed = await realtimeServer.seal({ query });

      return new Response(
        JSON.stringify({
          success: true,
          realtimeUrl: process.env.NEON_REALTIME_URL,
          sealed,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
