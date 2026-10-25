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

      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 404 });
      }

      const bot = await db.query.chatbot.findFirst({
        where: eq(chatbot.id, activeBotId),
      });

      if (!bot) {
        return new Response(JSON.stringify({ error: "Chatbot not found" }), { status: 404 });
      }

      const actions = await db.query.action.findMany({
        where: eq(action.chatbotId, activeBotId),
      });

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
        "hidePoweredBy",
        "personality",
        "initialMessage",
        "suggestedMessages",
        "isEmbeddingEnabled",
        "allowedDomains",
        "image",
      ];

      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      const [updated] = await db
        .update(chatbot)
        .set(updateData)
        .where(eq(chatbot.id, activeBotId))
        .returning();

      return new Response(JSON.stringify({ success: true, chatbot: updated }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const orgId = authSession.session.activeOrganizationId;
      if (!orgId) {
        return new Response(JSON.stringify({ error: "No active organization" }), { status: 400 });
      }

      const body = await request.json();
      const botId = uuidv4();
      const embedToken = `embed_${nanoid(4)}`;

      const [newBot] = await db
        .insert(chatbot)
        .values({
          id: botId,
          organizationId: orgId,
          name: body.name || "My Support Bot",
          primaryColor: body.primaryColor || "#800020",
          theme: body.theme || "light",
          personality: body.personality || "support",
          initialMessage: body.initialMessage || "Hello! How can I help you?",
          suggestedMessages: body.suggestedMessages || [],
          embedToken,
          isEmbeddingEnabled: true,
        })
        .returning();

      // Set as active chatbot
      await db
        .update(session)
        .set({ activeChatbotId: botId })
        .where(eq(session.id, authSession.session.id));

      return new Response(JSON.stringify({ success: true, chatbot: newBot }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  DELETE: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;
      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No chatbot selected" }), { status: 404 });
      }

      await db.delete(chatbot).where(eq(chatbot.id, activeBotId));

      // Reset active chatbot on session
      await db
        .update(session)
        .set({ activeChatbotId: null })
        .where(eq(session.id, authSession.session.id));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
