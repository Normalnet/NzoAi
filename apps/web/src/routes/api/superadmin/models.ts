import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../middlewares/auth";
import { getPlatformModels, updatePlatformModels, AIModelDefinition } from "../../../lib/ai/models";

export const ServerRoute = createServerFileRoute("/api/superadmin/models").methods({
  GET: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const models = getPlatformModels();
      return new Response(JSON.stringify({ models }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { models } = body;

      if (!Array.isArray(models)) {
        return new Response(JSON.stringify({ error: "Invalid payload: models must be an array" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      updatePlatformModels(models as AIModelDefinition[]);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Platform AI model catalog updated successfully.",
          models: getPlatformModels(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
