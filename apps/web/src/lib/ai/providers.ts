import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel, type LanguageModelV1 } from "ai";

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  dotenv.config({ path: path.resolve(__dirname, "../../../../../.env.local") });
  dotenv.config({ path: path.resolve(__dirname, "../../../../../.env") });
} catch {}

const apiKey = process.env.NEON_AI_GATEWAY_TOKEN || process.env.OPENAI_API_KEY || "";
const baseURL = process.env.NEON_AI_GATEWAY_BASE_URL
  ? `${process.env.NEON_AI_GATEWAY_BASE_URL}/v1`
  : undefined;

export const openai = createOpenAI({
  apiKey,
  baseURL,
});

/** Platform-wide fallback model when a chatbot / request does not specify one. */
export const DEFAULT_CHAT_MODEL_ID = "gpt-6-luna";

/**
 * Newer OpenAI reasoning-family models (GPT-5/6 series, o-series):
 *  - only accept the default temperature (the AI SDK otherwise sends temperature=0 → HTTP 400)
 *  - reject function tools on /v1/chat/completions, so they must use the Responses API
 *    (our chatbots rely on tools for lead capture, booking and human escalation).
 */
function isReasoningFamily(modelId: string): boolean {
  return /^(gpt-6|gpt-5|o\d)/i.test(modelId);
}

export function getChatModel(modelId: string = DEFAULT_CHAT_MODEL_ID): LanguageModelV1 {
  if (!isReasoningFamily(modelId)) {
    return openai(modelId);
  }

  return wrapLanguageModel({
    model: openai.responses(modelId),
    middleware: {
      transformParams: async ({ params }) => ({
        ...params,
        temperature: undefined,
        providerMetadata: {
          ...params.providerMetadata,
          openai: {
            ...(params.providerMetadata?.openai || {}),
            strictJsonSchema: false,
          },
        },
      }),
    },
  });
}

export const CHAT_MODEL = getChatModel(DEFAULT_CHAT_MODEL_ID);

export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small", {
  dimensions: 768,
});
