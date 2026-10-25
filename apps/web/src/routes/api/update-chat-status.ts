import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chat } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/update-chat-status").methods({
  PATCH: async ({ request }) => {
    try {
      await requireAuthSession(request);
      const { chatId, status } = await request.json();

      if (!chatId || !["unresolved", "resolved", "escalated"].includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid chatId or status value" }), { status: 400 });
      }

      const [updated] = await db
        .update(chat)
        .set({ status, updatedAt: new Date() })
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
