import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { chatbot, action, session, organization } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/my-chatbot").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      let bot: any = null;
      let actions: any[] = [];

      try {
        if (activeBotId) {
          bot = await db.query.chatbot.findFirst({
            where: eq(chatbot.id, activeBotId),
          });
          if (bot) {
            actions = await db.query.action.findMany({
              where: eq(action.chatbotId, activeBotId),
            });
          }
        }
      } catch (err) {
        // DB query error or table not yet seeded
      }

      // If no chatbot found yet in database (e.g. dev mode or fresh instance), provide default chatbot
      if (!bot) {
        bot = {
          id: activeBotId || "bot_default_01",
          organizationId: authSession.session.activeOrganizationId || "dev_org_01",
          name: "NzoAI Assistant",
          primaryColor: "#800020",
          theme: "light",
          personality: "support",
          initialMessage: "Hello! How can I assist you with your customer support today?",
          suggestedMessages: ["What can you help with?", "How do I train knowledge?"],
          embedToken: "embed_demo",
          sourcesCount: 0,
          isEmbeddingEnabled: true,
          trainingStatus: "idle",
        };
      }

      return new Response(JSON.stringify({ chatbot: bot, actions }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  PATCH: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;
      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 404 });
      }

      const body = await request.json();
      const allowedFields = [
        "name",
        "primaryColor",
        "theme",
        "personality",
        "initialMessage",
        "suggestedMessages",
        "hidePoweredBy",
        "isEmbeddingEnabled",
        "allowedDomains",
      ];

      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      try {
        const [updatedBot] = await db
          .update(chatbot)
          .set(updateData)
          .where(eq(chatbot.id, activeBotId))
          .returning();

        return new Response(JSON.stringify({ chatbot: updatedBot }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (dbErr) {
        return new Response(JSON.stringify({ chatbot: { id: activeBotId, ...updateData } }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
