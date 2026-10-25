import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { documentSource, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/document-source").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ documents: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const docs = await db.query.documentSource.findMany({
        where: eq(documentSource.chatbotId, activeBotId),
        orderBy: [documentSource.createdAt],
      });

      return new Response(JSON.stringify({ documents: docs }), {
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

      const { name, type, size, url } = await request.json();

      if (!name || !url) {
        return new Response(JSON.stringify({ error: "name and url are required" }), { status: 400 });
      }

      const [created] = await db
        .insert(documentSource)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          name,
          type: type || "application/octet-stream",
          size: Number(size || 0),
          url,
        })
        .returning();

      return new Response(JSON.stringify({ success: true, document: created }), {
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
      const documentId = url.searchParams.get("id");

      if (!documentId || !activeBotId) {
        return new Response(JSON.stringify({ error: "Document ID required" }), { status: 400 });
      }

      await db
        .delete(documentSource)
        .where(and(eq(documentSource.id, documentId), eq(documentSource.chatbotId, activeBotId)));

      await db
        .delete(knowledge)
        .where(and(eq(knowledge.sourceId, documentId), eq(knowledge.chatbotId, activeBotId)));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
