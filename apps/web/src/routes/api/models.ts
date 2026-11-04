import { createServerFileRoute } from "@/lib/server-route";
import { getActivePlatformModels } from "../../lib/ai/models";

export const ServerRoute = createServerFileRoute("/api/models").methods({
  GET: async () => {
    try {
      const models = getActivePlatformModels();
      return new Response(JSON.stringify({ models }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
});
