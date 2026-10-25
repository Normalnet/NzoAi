import { createServerFileRoute } from "@/lib/server-route";
import { streamText, convertToCoreMessages } from "ai";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { chatbot, chat } from "../../../../db/schema";
import { CHAT_MODEL } from "../../../../lib/ai/providers";
import { systemPrompt } from "../../../../lib/ai/prompts/system-prompt";
import { getActiveActionsForChatbot } from "../../../../lib/ai/get-active-tools";
import { buildActiveTools } from "../../../../lib/ai/build-active-tools";
import {
  getOrCreateChat,
  saveUserMessage,
  saveAssistantMessage,
  getChatbotByEmbedTokenOrName,
} from "../../../../lib/ai/chat-functions";
import { generateChatTitle } from "../../../../lib/ai/generate-titles";
import { checkRateLimit } from "../../../../middlewares/rate-limit";

export const ServerRoute = createServerFileRoute("/api/embed/chat/$platformIdentifier").methods({
  OPTIONS: async ({ request }) => {
    const origin = request.headers.get("origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  },

  POST: async ({ params, request }) => {
    const origin = request.headers.get("origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
      const { platformIdentifier } = params;
      const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

      // 1. Rate limiting (20/min/IP)
      const rateResult = await checkRateLimit("widget-chat", clientIp, 20, 60);
      if (!rateResult.success) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a minute." }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(rateResult.reset),
            },
          }
        );
      }

      // 2. Lookup chatbot
      const bot = await getChatbotByEmbedTokenOrName(platformIdentifier);
      if (!bot) {
        return new Response(JSON.stringify({ error: "Chatbot not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!bot.isEmbeddingEnabled) {
        return new Response(JSON.stringify({ error: "Chatbot embedding is currently disabled" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. Domain validation (if allowed_domains configured)
      const allowedDomains = (bot.allowedDomains as string[]) || [];
      if (allowedDomains.length > 0) {
        const referer = request.headers.get("referer") || "";
        const originHeader = request.headers.get("origin") || "";
        const hostToCheck = originHeader || referer;

        let domainAllowed = false;
        try {
          if (hostToCheck) {
            const parsedUrl = new URL(hostToCheck);
            domainAllowed = allowedDomains.some((d) =>
              parsedUrl.hostname === d || parsedUrl.hostname.endsWith("." + d)
            );
          }
        } catch (e) {}

        // In dev or localhost, allow
        if (!domainAllowed && !hostToCheck.includes("localhost") && !hostToCheck.includes("127.0.0.1")) {
          return new Response(JSON.stringify({ error: "Origin domain not permitted" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const body = await request.json();
      const { id: chatId, messages } = body;

      if (!chatId || !messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Missing required parameters: id, messages" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 4. Get or create Chat
      const currentChat = await getOrCreateChat({
        chatId,
        chatbotId: bot.id,
        channel: "widget",
      });

      // If escalated, return informative response
      if (currentChat.status === "escalated") {
        return new Response(
          JSON.stringify({ message: "AI responses are disabled. A human agent will join shortly." }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Save user message
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === "user") {
        const textContent =
          typeof lastUserMsg.content === "string"
            ? lastUserMsg.content
            : lastUserMsg.parts?.find((p: any) => p.type === "text")?.text || "";

        await saveUserMessage(chatId, [{ type: "text", text: textContent }]);

        if (messages.length <= 1) {
          generateChatTitle(chatId, textContent);
        }
      }

      // Build tools & prompt
      const actionsMap = await getActiveActionsForChatbot(bot.id);
      const prompt = systemPrompt(bot.name, bot.personality, actionsMap);
      const tools = buildActiveTools(chatId, bot.id, actionsMap);

      const result = streamText({
        model: CHAT_MODEL,
        system: prompt,
        messages: convertToCoreMessages(messages),
        tools,
        maxSteps: 5,
        onFinish: async ({ response }) => {
          if (response?.messages) {
            for (const msg of response.messages) {
              if (msg.role === "assistant") {
                const parts = Array.isArray(msg.content)
                  ? msg.content
                  : [{ type: "text", text: String(msg.content || "") }];
                await saveAssistantMessage(chatId, parts);
              }
            }
          }
        },
      });

      const responseStream = result.toDataStreamResponse();
      // Attach CORS headers
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseStream.headers.set(key, value);
      }
      return responseStream;
    } catch (err: any) {
      console.error("[api/embed/chat error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.statusCode || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
});
