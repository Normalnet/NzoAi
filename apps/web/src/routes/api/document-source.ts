import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { chatbot, documentSource, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";
import { chunkDocument, extractTextFromDocument } from "../../lib/ai/document-chunking";
import { generateBatchEmbeddings } from "../../lib/ai/embeddings";

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

      // Automatically chunk and index document into vector knowledge table immediately on upload
      let indexedChunks = 0;
      if (finalContent && finalContent.trim().length > 0) {
        try {
          const chunks = chunkDocument(finalContent, 500, 20);
          if (chunks.length > 0) {
            const embeddings = await generateBatchEmbeddings(chunks);
            const rowsToInsert = chunks.map((chunk, idx) => ({
              id: uuidv4(),
              chatbotId: activeBotId,
              source: "document",
              sourceId: created.id,
              content: chunk,
              embedding: embeddings[idx] || new Array(768).fill(0),
              metadata: { documentName: name, chunkIndex: idx },
            }));
            for (let i = 0; i < rowsToInsert.length; i += 50) {
              await db.insert(knowledge).values(rowsToInsert.slice(i, i + 50));
            }
            indexedChunks = rowsToInsert.length;
            await db
              .update(chatbot)
              .set({
                trainingStatus: "completed",
                lastTrainedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(chatbot.id, activeBotId));
          }
        } catch (indexErr) {
          console.warn("[document-source] Auto-indexing warning:", indexErr);
        }
      }

      return new Response(JSON.stringify({ success: true, document: created, indexedChunks }), {
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
