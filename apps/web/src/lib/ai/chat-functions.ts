import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { chat, message, chatbot } from "../../db/schema";

export async function getOrCreateChat({
  chatId,
  chatbotId,
  userId,
  channel = "widget",
  metadata = {},
}: {
  chatId: string;
  chatbotId: string;
  userId?: string | null;
  channel?: string;
  metadata?: any;
}) {
  const existing = await db.query.chat.findFirst({
    where: eq(chat.id, chatId),
  });

  if (existing) {
    return existing;
  }

  const [newChat] = await db
    .insert(chat)
    .values({
      id: chatId,
      chatbot_id: chatbotId,
      userId: userId || null,
      channel,
      status: "unresolved",
      chat_meta_data: metadata,
    })
    .returning();

  return newChat;
}

export async function saveUserMessage(chatId: string, parts: any[]) {
  const msgId = uuidv4();
  const [created] = await db
    .insert(message)
    .values({
      id: msgId,
      chatId,
      role: "user",
      parts,
    })
    .returning();
  return created;
}

export async function saveAssistantMessage(chatId: string, parts: any[]) {
  const msgId = uuidv4();
  const [created] = await db
    .insert(message)
    .values({
      id: msgId,
      chatId,
      role: "assistant",
      parts,
    })
    .returning();
  return created;
}

export async function getChatMessages(chatId: string) {
  return await db.query.message.findMany({
    where: eq(message.chatId, chatId),
    orderBy: [message.createdAt],
  });
}

export async function getChatbotByEmbedTokenOrName(identifier: string) {
  if (!identifier) return null;

  // Exact embed token match
  const botByToken = await db.query.chatbot.findFirst({
    where: eq(chatbot.embedToken, identifier),
  });
  if (botByToken) return botByToken;

  // Fallback match by name
  return await db.query.chatbot.findFirst({
    where: eq(chatbot.name, identifier),
  });
}
