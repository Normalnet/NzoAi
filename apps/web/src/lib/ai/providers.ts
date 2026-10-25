import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const CHAT_MODEL = openai("gpt-4o-mini");
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small", {
  dimensions: 768,
});
