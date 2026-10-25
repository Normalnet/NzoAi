import { tool, generateText } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { chat, chatbot, member, user } from "../../../db/schema";
import { CHAT_MODEL } from "../providers";
import { Resend } from "resend";

export function createEscalateToHumanTool(chatId: string, chatbotId: string) {
  return tool({
    description: "Escalate the conversation to a human support agent when the visitor asks for a human or has complex unresolved issues.",
    parameters: z.object({
      reason: z.string().describe("The concise reason why this conversation needs human attention"),
    }),
    execute: async ({ reason }) => {
      // 1. Fetch current chat and bot details
      const currentChat = await db.query.chat.findFirst({
        where: eq(chat.id, chatId),
      });

      const currentBot = await db.query.chatbot.findFirst({
        where: eq(chatbot.id, chatbotId),
      });

      // 2. Generate a concise summary
      let summary = reason;
      try {
        const { text: generatedSummary } = await generateText({
          model: CHAT_MODEL,
          system: "Summarize the customer conversation and their issue in 50 words or fewer for human support agents.",
          prompt: `Reason for escalation: ${reason}`,
        });
        summary = generatedSummary;
      } catch (err) {
        console.warn("[escalation] Summary generation fallback:", err);
      }

      // 3. Mark chat as escalated in DB
      await db
        .update(chat)
        .set({ status: "escalated", updatedAt: new Date() })
        .where(eq(chat.id, chatId));

      // 4. Send email notification to org members if Resend is configured
      if (process.env.RESEND_API_KEY && currentBot?.organizationId) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          // Get all member emails
          const members = await db
            .select({ email: user.email })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .where(eq(member.organizationId, currentBot.organizationId));

          const recipientEmails = members.map((m) => m.email).filter(Boolean);

          // Batch in chunks of 50 (Resend limit)
          for (let i = 0; i < recipientEmails.length; i += 50) {
            const batch = recipientEmails.slice(i, i + 50);
            if (batch.length > 0) {
              await resend.emails.send({
                from: "escalation@nzoai.com",
                to: batch,
                subject: `[Escalation] Visitor requesting human assistance - ${currentBot.name}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #800020;">Chat Escalation Alert</h2>
                    <p>A visitor has requested human support for chatbot <strong>${currentBot.name}</strong>.</p>
                    <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                      <p><strong>Chat ID:</strong> ${chatId}</p>
                      <p><strong>Reason:</strong> ${reason}</p>
                      <p><strong>Summary:</strong> ${summary}</p>
                    </div>
                    <p>Open your NzoAI dashboard to join and reply to the customer in real time.</p>
                  </div>
                `,
              });
            }
          }
        } catch (emailErr) {
          console.error("[escalation] Failed to send email alert:", emailErr);
        }
      }

      // 5. Notify the realtime server service using the bound SERVER_URL
      const serverUrl = process.env.SERVER_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);
      if (serverUrl) {
        try {
          await fetch(new URL("/api/escalations/notify", serverUrl), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, reason, summary }),
          });
        } catch (serverErr) {
          console.warn("[escalation] Failed to notify internal server service:", serverErr);
        }
      }

      return {
        escalated: true,
        status: "escalated",
        reason,
        summary,
        message: "I've escalated your conversation to our team. A human agent will join shortly!",
      };
    },
  });
}
