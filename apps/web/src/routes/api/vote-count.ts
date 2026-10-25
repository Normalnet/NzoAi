import { createServerFileRoute } from "@/lib/server-route";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { vote, chat } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/vote-count").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ upvotes: 0, downvotes: 0 }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const votes = await db
        .select({
          isUpvoted: vote.isUpvoted,
          count: sql<number>`count(*)`,
        })
        .from(vote)
        .innerJoin(chat, eq(vote.chatId, chat.id))
        .where(eq(chat.chatbot_id, activeBotId))
        .groupBy(vote.isUpvoted);

      let upvotes = 0;
      let downvotes = 0;

      for (const row of votes) {
        if (row.isUpvoted) upvotes = Number(row.count);
        else downvotes = Number(row.count);
      }

      return new Response(JSON.stringify({ upvotes, downvotes }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
