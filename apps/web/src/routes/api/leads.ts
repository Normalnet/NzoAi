import { createServerFileRoute } from "@/lib/server-route";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { lead, chatbot } from "../../db/schema";
import { getSessionFromRequest } from "../../middlewares/auth";
import { getChatbotByEmbedTokenOrName } from "../../lib/ai/chat-functions";

export const ServerRoute = createServerFileRoute("/api/leads").methods({
  OPTIONS: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },

  POST: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Content-Type": "application/json",
    };

    try {
      const body = await request.json();
      const { name, contact, message, embedToken, chatbotId: explicitBotId } = body;

      if (!name || !contact) {
        return new Response(JSON.stringify({ error: "name and contact are required" }), {
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

      const [created] = await db
        .insert(lead)
        .values({
          id: uuidv4(),
          chatbotId: targetBotId,
          name,
          contact,
          message: message || null,
          location: { ip: clientIp, country, city },
        })
        .returning();

      return new Response(JSON.stringify({ success: true, lead: created }), {
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
