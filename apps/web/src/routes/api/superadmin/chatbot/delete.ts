import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { chatbot } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/chatbot/delete").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { chatbotId } = body;

      if (!chatbotId) {
        return new Response(JSON.stringify({ error: "chatbotId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.delete(chatbot).where(eq(chatbot.id, chatbotId));

      return new Response(
        JSON.stringify({
          success: true,
          message: `Chatbot ${chatbotId} and associated knowledge base deleted successfully.`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
