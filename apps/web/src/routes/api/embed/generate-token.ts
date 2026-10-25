import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../../db";
import { chatbot } from "../../../db/schema";
import { requireAuthSession } from "../../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/embed/generate-token").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;
      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 404 });
      }

      const newToken = `embed_${nanoid(4)}`;
      const [updated] = await db
        .update(chatbot)
        .set({ embedToken: newToken, updatedAt: new Date() })
        .where(eq(chatbot.id, activeBotId))
        .returning();

      return new Response(JSON.stringify({ success: true, embedToken: updated.embedToken }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
