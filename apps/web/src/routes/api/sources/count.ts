import { createServerFileRoute } from "@/lib/server-route";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { documentSource, textSource, question, websiteSource } from "../../../db/schema";
import { requireAuthSession } from "../../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/sources/count").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(
          JSON.stringify({ documents: 0, texts: 0, questions: 0, websites: 0, total: 0 }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const [docRes, textRes, qRes, webRes] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(documentSource).where(eq(documentSource.chatbotId, activeBotId)),
        db.select({ count: sql<number>`count(*)` }).from(textSource).where(eq(textSource.chatbotId, activeBotId)),
        db.select({ count: sql<number>`count(*)` }).from(question).where(eq(question.chatbotId, activeBotId)),
        db.select({ count: sql<number>`count(*)` }).from(websiteSource).where(eq(websiteSource.chatbotId, activeBotId)),
      ]);

      const docCount = Number(docRes[0]?.count ?? 0);
      const textCount = Number(textRes[0]?.count ?? 0);
      const qCount = Number(qRes[0]?.count ?? 0);
      const webCount = Number(webRes[0]?.count ?? 0);
      const total = docCount + textCount + qCount + webCount;

      return new Response(
        JSON.stringify({
          documents: docCount,
          texts: textCount,
          questions: qCount,
          websites: webCount,
          total,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
