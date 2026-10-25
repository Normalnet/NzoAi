import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { chat } from "../../../db/schema";
import { requireAuthSession } from "../../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/chat/assign-agent").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const { chatId, memberId } = await request.json();

      if (!chatId) {
        return new Response(JSON.stringify({ error: "chatId is required" }), { status: 400 });
      }

      const assignedId = memberId || authSession.user.id;

      const [updated] = await db
        .update(chat)
        .set({
          agent_assigned: assignedId,
          status: "escalated",
          updatedAt: new Date(),
        })
        .where(eq(chat.id, chatId))
        .returning();

      return new Response(JSON.stringify({ success: true, chat: updated }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
