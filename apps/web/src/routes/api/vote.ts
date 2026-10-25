import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { vote } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/vote").methods({
  GET: async ({ request }) => {
    try {
      await requireAuthSession(request);
      const url = new URL(request.url);
      const chatId = url.searchParams.get("chatId");

      if (!chatId) {
        return new Response(JSON.stringify({ error: "chatId query parameter required" }), { status: 400 });
      }

      const votes = await db.query.vote.findMany({
        where: eq(vote.chatId, chatId),
      });

      return new Response(JSON.stringify({ votes }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  PATCH: async ({ request }) => {
    try {
      await requireAuthSession(request);
      const { chatId, messageId, isUpvoted } = await request.json();

      if (!chatId || !messageId || typeof isUpvoted !== "boolean") {
        return new Response(JSON.stringify({ error: "Invalid vote parameters" }), { status: 400 });
      }

      await db
        .insert(vote)
        .values({ chatId, messageId, isUpvoted })
        .onConflictDoUpdate({
          target: [vote.chatId, vote.messageId],
          set: { isUpvoted },
        });

      return new Response(JSON.stringify({ success: true, chatId, messageId, isUpvoted }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
