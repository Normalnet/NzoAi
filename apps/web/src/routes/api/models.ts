import { createServerFileRoute } from "@/lib/server-route";
import { fetchPlatformModelsFromDB } from "../../lib/ai/models";

export const ServerRoute = createServerFileRoute("/api/models").methods({
  GET: async () => {
    try {
      const allModels = await fetchPlatformModelsFromDB();
      const activeModels = allModels.filter((m) => m.isActive);
      return new Response(JSON.stringify({ models: activeModels }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
});
