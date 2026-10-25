import { createServerFileRoute } from "@/lib/server-route";
import { streamText, convertToCoreMessages } from "ai";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chatbot, chat } from "../../db/schema";
import { CHAT_MODEL } from "../../lib/ai/providers";
import { systemPrompt } from "../../lib/ai/prompts/system-prompt";
import { getActiveActionsForChatbot } from "../../lib/ai/get-active-tools";
import { buildActiveTools } from "../../lib/ai/build-active-tools";
import { getOrCreateChat, saveUserMessage, saveAssistantMessage } from "../../lib/ai/chat-functions";
import { generateChatTitle } from "../../lib/ai/generate-titles";
import { requireAuthSession } from "../../middlewares/auth";
import { checkRateLimit } from "../../middlewares/rate-limit";

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 404 });
      }

      // Rate limit check
      const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const rateResult = await checkRateLimit("playground-chat", clientIp, 30, 60);
      if (!rateResult.success) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { "Retry-After": String(rateResult.reset) },
        });
      }

      const body = await request.json();
      const { id: chatId, messages } = body;

      if (!chatId || !messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Missing required parameters: id, messages" }), { status: 400 });
      }

      const bot = await db.query.chatbot.findFirst({
        where: eq(chatbot.id, activeBotId),
      });

      if (!bot) {
        return new Response(JSON.stringify({ error: "Chatbot not found" }), { status: 404 });
      }

      // Check or create chat record
      const currentChat = await getOrCreateChat({
        chatId,
        chatbotId: activeBotId,
        userId: authSession.user.id,
        channel: "web",
      });

      // If escalated, return disabled response
      if (currentChat.status === "escalated") {
        return new Response(
          JSON.stringify({ message: "AI responses are disabled while a human agent is active." }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Save user message to DB
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === "user") {
        const textContent =
          typeof lastUserMsg.content === "string"
            ? lastUserMsg.content
            : lastUserMsg.parts?.find((p: any) => p.type === "text")?.text || "";

        await saveUserMessage(chatId, [{ type: "text", text: textContent }]);

        // Generate title if new chat
        if (messages.length <= 1) {
          generateChatTitle(chatId, textContent);
        }
      }

      // Build active tools and system prompt
      const actionsMap = await getActiveActionsForChatbot(activeBotId);
      const prompt = systemPrompt(bot.name, bot.personality, actionsMap);
      const tools = buildActiveTools(chatId, activeBotId, actionsMap);

      const result = streamText({
        model: CHAT_MODEL,
        system: prompt,
        messages: convertToCoreMessages(messages),
        tools,
        maxSteps: 5,
        onFinish: async ({ response }) => {
          // Save assistant message and tool parts to DB
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

      return result.toDataStreamResponse();
    } catch (err: any) {
      console.error("[api/chat error]:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
