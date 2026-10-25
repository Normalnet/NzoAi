import { pgTable, text, timestamp, jsonb, json } from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("userId"),
  chatbot_id: text("chatbot_id"),
  visibility: text("visibility").default("private"),
  channel: text("channel").default("widget"), // 'web' | 'widget' | 'whatsapp' | 'telegram'
  status: text("status").default("unresolved").notNull(), // 'unresolved' | 'resolved' | 'escalated'
  agent_assigned: text("agent_assigned"),
  chat_meta_data: jsonb("chat_meta_data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const message = pgTable("Message", {
  id: text("id").primaryKey(),
  chatId: text("chatId").notNull().references(() => chat.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'system' | 'assistant' | 'user' | 'human'
  parts: json("parts").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Chat = typeof chat.$inferSelect;
export type Message = typeof message.$inferSelect;
