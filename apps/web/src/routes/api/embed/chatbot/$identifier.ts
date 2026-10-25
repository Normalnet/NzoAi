import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { chatbot, action } from "../../../../db/schema";
import { withCache } from "../../../../lib/redis/cache";

export const ServerRoute = createServerFileRoute("/api/embed/chatbot/$identifier").methods({
  OPTIONS: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },

  GET: async ({ params, request }) => {
    const origin = request.headers.get("origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
    };

    try {
      const { identifier } = params;
      const cacheKey = `embed:chatbot:${identifier}`;

      const data = await withCache(cacheKey, 120, async () => {
        let bot = await db.query.chatbot.findFirst({
          where: eq(chatbot.embedToken, identifier),
        });

        if (!bot) {
          bot = await db.query.chatbot.findFirst({
            where: eq(chatbot.name, identifier),
          });
        }

        if (!bot) return null;

        const quickActions = await db.query.action.findMany({
          where: eq(action.chatbotId, bot.id),
        });

        return {
          id: bot.id,
          name: bot.name,
          image: bot.image,
          primaryColor: bot.primaryColor,
          theme: bot.theme,
          hidePoweredBy: bot.hidePoweredBy,
          initialMessage: bot.initialMessage,
          suggestedMessages: bot.suggestedMessages,
          isEmbeddingEnabled: bot.isEmbeddingEnabled,
          allowedDomains: bot.allowedDomains,
          quickActions: quickActions
            .filter((a) => a.isActive && a.showInQuickMenu)
            .map((a) => ({
              id: a.id,
              name: a.name,
              toolName: a.toolName,
              actionProperties: a.actionProperties,
            })),
        };
      });

      if (!data) {
        return new Response(JSON.stringify({ error: "Chatbot not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
});
