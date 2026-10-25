import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { action } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/agent-actions").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ actions: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const actions = await db.query.action.findMany({
        where: eq(action.chatbotId, activeBotId),
        orderBy: [action.createdAt],
      });

      return new Response(JSON.stringify({ actions }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 400 });
      }

      const { toolName, name, description, isActive = true, showInQuickMenu = false, actionProperties = {} } =
        await request.json();

      if (!toolName || !name || !description) {
        return new Response(JSON.stringify({ error: "toolName, name, and description are required" }), {
          status: 400,
        });
      }

      const [created] = await db
        .insert(action)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          toolName,
          name,
          description,
          isActive,
          showInQuickMenu,
          actionProperties,
        })
        .returning();

      return new Response(JSON.stringify({ success: true, action: created }), {
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
      const body = await request.json();
      const { id, ...updates } = body;

      if (!id || !activeBotId) {
        return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
      }

      const [updated] = await db
        .update(action)
        .set(updates)
        .where(and(eq(action.id, id), eq(action.chatbotId, activeBotId)))
        .returning();

      return new Response(JSON.stringify({ success: true, action: updated }), {
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
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id || !activeBotId) {
        return new Response(JSON.stringify({ error: "id parameter required" }), { status: 400 });
      }

      await db.delete(action).where(and(eq(action.id, id), eq(action.chatbotId, activeBotId)));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
