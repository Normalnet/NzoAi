import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.NEON_AI_GATEWAY_TOKEN || process.env.OPENAI_API_KEY || "";
const baseURL = process.env.NEON_AI_GATEWAY_BASE_URL
  ? `${process.env.NEON_AI_GATEWAY_BASE_URL}/v1`
  : undefined;

export const openai = createOpenAI({
  apiKey,
  baseURL,
});

export const CHAT_MODEL = openai("gpt-4o-mini");

export function getChatModel(modelId: string = "gpt-4o-mini") {
  return openai(modelId);
}

export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small", {
  dimensions: 768,
});
