import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { documentSource, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";
import { extractTextFromDocument } from "../../lib/ai/document-chunking";

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

      const { name, type, size, url, content } = await request.json();

      if (!name || (!url && !content)) {
        return new Response(JSON.stringify({ error: "name and either url or content are required" }), { status: 400 });
      }

      let finalContent = content || "";

      // Fallback: If content was not passed directly but a data URL was provided, extract it
      if (!finalContent && url && typeof url === "string" && url.startsWith("data:")) {
        try {
          const match = url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const buffer = Buffer.from(match[2], "base64");
            finalContent = await extractTextFromDocument(buffer, mimeType, name);
            finalContent = finalContent.replace(/\0/g, "").trim();
          }
        } catch (extractErr) {
          console.warn("[document-source] Fallback text extraction failed:", extractErr);
        }
      }

      const documentUrl = url || `direct://docs/${uuidv4()}/${encodeURIComponent(name)}`;

      const [created] = await db
        .insert(documentSource)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          name,
          type: type || "application/octet-stream",
          size: Number(size || 0),
          url: documentUrl,
          content: finalContent || null,
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
