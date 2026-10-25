import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import {
  chatbot,
  knowledge,
  textSource,
  question,
  websiteSource,
  documentSource,
} from "../../db/schema";
import { chunkDocument, extractTextFromDocument } from "../../lib/ai/document-chunking";
import { generateBatchEmbeddings } from "../../lib/ai/embeddings";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/train-agent").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 400 });
      }

      // 1. Mark training in progress
      await db
        .update(chatbot)
        .set({ trainingStatus: "in-progress", updatedAt: new Date() })
        .where(eq(chatbot.id, activeBotId));

      try {
        // 2. Clear old knowledge rows
        await db.delete(knowledge).where(eq(knowledge.chatbotId, activeBotId));

        let totalSourcesCount = 0;
        const allKnowledgeToInsert: Array<{
          id: string;
          chatbotId: string;
          source: string;
          sourceId: string;
          content: string;
          embedding: number[];
          metadata: any;
        }> = [];

        // 3. Process Text Sources
        const textSourcesList = await db.query.textSource.findMany({
          where: eq(textSource.chatbotId, activeBotId),
        });
        totalSourcesCount += textSourcesList.length;

        for (const ts of textSourcesList) {
          const chunks = chunkDocument(ts.content, 500, 20);
          if (chunks.length > 0) {
            const embeddings = await generateBatchEmbeddings(chunks);
            chunks.forEach((chunk, idx) => {
              allKnowledgeToInsert.push({
                id: uuidv4(),
                chatbotId: activeBotId,
                source: "text",
                sourceId: ts.id,
                content: chunk,
                embedding: embeddings[idx] || new Array(768).fill(0),
                metadata: { title: ts.title, chunkIndex: idx },
              });
            });
          }
        }

        // 4. Process Q&A Questions
        const questionsList = await db.query.question.findMany({
          where: eq(question.chatbotId, activeBotId),
        });
        totalSourcesCount += questionsList.length;

        if (questionsList.length > 0) {
          const qTexts = questionsList.map((q) => q.question);
          const qEmbeddings = await generateBatchEmbeddings(qTexts);

          questionsList.forEach((q, idx) => {
            allKnowledgeToInsert.push({
              id: uuidv4(),
              chatbotId: activeBotId,
              source: "qna",
              sourceId: q.id,
              content: `Question: ${q.question}\nAnswer: ${q.answer}`,
              embedding: qEmbeddings[idx] || new Array(768).fill(0),
              metadata: { question: q.question, answer: q.answer },
            });
          });
        }

        // 5. Process Website Sources
        const websiteSourcesList = await db.query.websiteSource.findMany({
          where: eq(websiteSource.chatbotId, activeBotId),
        });
        totalSourcesCount += websiteSourcesList.length;

        for (const ws of websiteSourcesList) {
          const chunks = chunkDocument(ws.markdown, 500, 20);
          if (chunks.length > 0) {
            const embeddings = await generateBatchEmbeddings(chunks);
            chunks.forEach((chunk, idx) => {
              allKnowledgeToInsert.push({
                id: uuidv4(),
                chatbotId: activeBotId,
                source: "website",
                sourceId: ws.id,
                content: chunk,
                embedding: embeddings[idx] || new Array(768).fill(0),
                metadata: { url: ws.url, chunkIndex: idx },
              });
            });
          }
        }

        // 6. Process Document Sources
        const documentSourcesList = await db.query.documentSource.findMany({
          where: eq(documentSource.chatbotId, activeBotId),
        });
        totalSourcesCount += documentSourcesList.length;

        for (const ds of documentSourcesList) {
          try {
            const fileRes = await fetch(ds.url);
            if (fileRes.ok) {
              const arrayBuf = await fileRes.arrayBuffer();
              const text = await extractTextFromDocument(Buffer.from(arrayBuf), ds.type, ds.name);
              const chunks = chunkDocument(text, 500, 20);
              if (chunks.length > 0) {
                const embeddings = await generateBatchEmbeddings(chunks);
                chunks.forEach((chunk, idx) => {
                  allKnowledgeToInsert.push({
                    id: uuidv4(),
                    chatbotId: activeBotId,
                    source: "document",
                    sourceId: ds.id,
                    content: chunk,
                    embedding: embeddings[idx] || new Array(768).fill(0),
                    metadata: { documentName: ds.name, chunkIndex: idx },
                  });
                });
              }
            }
          } catch (docErr) {
            console.warn(`[train] Skipped document ${ds.name}:`, docErr);
          }
        }

        // 7. Batch insert all knowledge chunks (in batches of 50)
        for (let i = 0; i < allKnowledgeToInsert.length; i += 50) {
          const batch = allKnowledgeToInsert.slice(i, i + 50);
          await db.insert(knowledge).values(batch);
        }

        // 8. Update chatbot status to completed
        await db
          .update(chatbot)
          .set({
            trainingStatus: "completed",
            lastTrainedAt: new Date(),
            sourcesCount: totalSourcesCount,
            updatedAt: new Date(),
          })
          .where(eq(chatbot.id, activeBotId));

        return new Response(
          JSON.stringify({
            success: true,
            totalSources: totalSourcesCount,
            totalChunks: allKnowledgeToInsert.length,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (trainErr: any) {
        console.error("[train error]:", trainErr);
        await db
          .update(chatbot)
          .set({ trainingStatus: "failed", updatedAt: new Date() })
          .where(eq(chatbot.id, activeBotId));

        return new Response(JSON.stringify({ error: trainErr.message }), { status: 500 });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
