import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chatbot } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/training-status").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ trainingStatus: "idle", lastTrainedAt: null, sourcesCount: 0 }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const bot = await db.query.chatbot.findFirst({
        where: eq(chatbot.id, activeBotId),
      });

      return new Response(
        JSON.stringify({
          trainingStatus: bot?.trainingStatus || "idle",
          lastTrainedAt: bot?.lastTrainedAt || null,
          sourcesCount: bot?.sourcesCount || 0,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
