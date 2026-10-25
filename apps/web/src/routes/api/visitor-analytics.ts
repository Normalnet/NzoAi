import { createServerFileRoute } from "@/lib/server-route";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { visitorAnalytics } from "../../db/schema";
import { getSessionFromRequest, requireAuthSession } from "../../middlewares/auth";
import { getChatbotByEmbedTokenOrName } from "../../lib/ai/chat-functions";

export const ServerRoute = createServerFileRoute("/api/visitor-analytics").methods({
  OPTIONS: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },

  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ events: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const events = await db.query.visitorAnalytics.findMany({
        where: eq(visitorAnalytics.chatbotId, activeBotId),
        orderBy: [desc(visitorAnalytics.createdAt)],
        limit: 500,
      });

      return new Response(JSON.stringify({ events }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Content-Type": "application/json",
    };

    try {
      const body = await request.json();
      const { visitorId, event, durationMs, extra, embedToken, chatbotId: explicitBotId } = body;

      if (!visitorId || !event) {
        return new Response(JSON.stringify({ error: "visitorId and event are required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      let targetBotId = explicitBotId;
      if (!targetBotId && embedToken) {
        const bot = await getChatbotByEmbedTokenOrName(embedToken);
        if (bot) targetBotId = bot.id;
      }
      if (!targetBotId) {
        const session = await getSessionFromRequest(request);
        targetBotId = session?.session.activeChatbotId;
      }
      if (!targetBotId) {
        return new Response(JSON.stringify({ error: "Target chatbot not resolved" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
      const country = request.headers.get("cf-ipcountry") || "GH";
      const city = request.headers.get("cf-ipcity") || "Accra";
      const referer = request.headers.get("referer") || "";
      const userAgent = request.headers.get("user-agent") || "";

      let device = "Desktop";
      if (/mobile|android|iphone|ipad/i.test(userAgent)) {
        device = "Mobile";
      }

      const [created] = await db
        .insert(visitorAnalytics)
        .values({
          id: uuidv4(),
          chatbotId: targetBotId,
          visitorId,
          event,
          durationMs: Number(durationMs || 0),
          device,
          city,
          country,
          ip: clientIp,
          referer,
          extra: extra || {},
        })
        .returning();

      return new Response(JSON.stringify({ success: true, event: created }), {
        status: 201,
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
