import { createServerFileRoute } from "@/lib/server-route";
import { eq, and, desc, asc, lt } from "drizzle-orm";
import { db } from "../../../db";
import { chat, message } from "../../../db/schema";
import { requireAuthSession } from "../../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/chat/history").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ chats: [], nextCursor: null }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(request.url);
      const chatIdParam = url.searchParams.get("chatId");

      // 1. If chatId is provided, return transcript messages
      if (chatIdParam) {
        const targetChat = await db.query.chat.findFirst({
          where: and(eq(chat.id, chatIdParam), eq(chat.chatbot_id, activeBotId)),
        });

        if (!targetChat) {
          return new Response(JSON.stringify({ error: "Chat not found" }), { status: 404 });
        }

        const messages = await db.query.message.findMany({
          where: eq(message.chatId, chatIdParam),
          orderBy: [asc(message.createdAt)],
        });

        return new Response(JSON.stringify({ chatId: chatIdParam, chat: targetChat, messages }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Otherwise return conversation list for inbox
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));
      const cursor = url.searchParams.get("cursor");
      const statusFilter = url.searchParams.get("status"); // 'all' | 'unresolved' | 'resolved' | 'escalated'

      const conditions = [eq(chat.chatbot_id, activeBotId)];

      if (statusFilter && statusFilter !== "all") {
        conditions.push(eq(chat.status, statusFilter));
      }

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          conditions.push(lt(chat.createdAt, cursorDate));
        }
      }

      let chats: any[] = [];
      try {
        chats = await db.query.chat.findMany({
          where: and(...conditions),
          orderBy: [desc(chat.createdAt)],
          limit: limit + 1,
        });
      } catch (dbErr) {
        chats = [];
      }

      let nextCursor: string | null = null;
      if (chats.length > limit) {
        const nextItem = chats.pop();
        nextCursor = nextItem ? nextItem.createdAt.toISOString() : null;
      }

      return new Response(JSON.stringify({ chats, nextCursor }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status || err.statusCode || 500,
      });
    }
  },
});
