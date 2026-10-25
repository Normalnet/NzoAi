import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { textSource, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/text-sources").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ textSources: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const sources = await db.query.textSource.findMany({
        where: eq(textSource.chatbotId, activeBotId),
        orderBy: [textSource.createdAt],
      });

      return new Response(JSON.stringify({ textSources: sources }), {
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

      const { title, content } = await request.json();

      if (!title || !content) {
        return new Response(JSON.stringify({ error: "title and content are required" }), { status: 400 });
      }

      const [created] = await db
        .insert(textSource)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          title,
          content,
        })
        .returning();

      return new Response(JSON.stringify({ success: true, textSource: created }), {
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
      const { id, title, content } = await request.json();

      if (!id || !activeBotId) {
        return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
      }

      const [updated] = await db
        .update(textSource)
        .set({ title, content })
        .where(and(eq(textSource.id, id), eq(textSource.chatbotId, activeBotId)))
        .returning();

      return new Response(JSON.stringify({ success: true, textSource: updated }), {
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

      await db
        .delete(textSource)
        .where(and(eq(textSource.id, id), eq(textSource.chatbotId, activeBotId)));

      await db
        .delete(knowledge)
        .where(and(eq(knowledge.sourceId, id), eq(knowledge.chatbotId, activeBotId)));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
