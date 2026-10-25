import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { question, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/questions").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ questions: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const qas = await db.query.question.findMany({
        where: eq(question.chatbotId, activeBotId),
        orderBy: [question.createdAt],
      });

      return new Response(JSON.stringify({ questions: qas }), {
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

      const { question: qText, answer } = await request.json();

      if (!qText || !answer) {
        return new Response(JSON.stringify({ error: "question and answer are required" }), { status: 400 });
      }

      const [created] = await db
        .insert(question)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          question: qText,
          answer,
        })
        .returning();

      return new Response(JSON.stringify({ success: true, question: created }), {
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
      const { id, question: qText, answer } = await request.json();

      if (!id || !activeBotId) {
        return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
      }

      const [updated] = await db
        .update(question)
        .set({ question: qText, answer })
        .where(and(eq(question.id, id), eq(question.chatbotId, activeBotId)))
        .returning();

      return new Response(JSON.stringify({ success: true, question: updated }), {
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
        .delete(question)
        .where(and(eq(question.id, id), eq(question.chatbotId, activeBotId)));

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
