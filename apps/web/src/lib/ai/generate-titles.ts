import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chat } from "../../db/schema";
import { CHAT_MODEL } from "./providers";

export async function generateChatTitle(chatId: string, firstUserMessage: string) {
  try {
    const { text } = await generateText({
      model: CHAT_MODEL,
      system: "Generate a short, concise title (max 5-6 words, no punctuation) that summarizes the user inquiry.",
      prompt: firstUserMessage,
    });

    const cleanTitle = text.replace(/["']/g, "").trim();
    if (cleanTitle) {
      await db
        .update(chat)
        .set({ title: cleanTitle, updatedAt: new Date() })
        .where(eq(chat.id, chatId));
    }
    return cleanTitle;
  } catch (err) {
    console.warn("[chat] Title generation skipped:", err);
    return "New Conversation";
  }
}
