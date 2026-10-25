import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { session, chatbot } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/set-active-chatbot").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const { chatbotId } = await request.json();

      if (!chatbotId) {
        return new Response(JSON.stringify({ error: "chatbotId is required" }), { status: 400 });
      }

      // Verify the bot belongs to user's active organization
      const bot = await db.query.chatbot.findFirst({
        where: and(
          eq(chatbot.id, chatbotId),
          eq(chatbot.organizationId, authSession.session.activeOrganizationId || "")
        ),
      });

      if (!bot) {
        return new Response(JSON.stringify({ error: "Chatbot not found in your organization" }), { status: 404 });
      }

      // Update session
      await db
        .update(session)
        .set({ activeChatbotId: chatbotId, updatedAt: new Date() })
        .where(eq(session.id, authSession.session.id));

      return new Response(JSON.stringify({ success: true, activeChatbotId: chatbotId }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
