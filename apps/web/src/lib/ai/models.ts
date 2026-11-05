import { db } from "../../db";
import { aiModel } from "../../db/schema";
import { asc, eq } from "drizzle-orm";

export interface AIModelDefinition {
  id: string; // Underlying provider model id (e.g., "gpt-4o", "gemini-2.0-flash")
  displayName: string; // White-label brand name (e.g., "NzoOpen 4 Basic", "NzoGem 3 Cool")
  provider: "openai" | "google" | "anthropic" | "groq" | "mistral" | "custom";
  description: string;
  badge?: string; // "Recommended", "Ultra Fast", "Flagship"
  category?: string; // "fast" | "reasoning" | "balanced" | "pro"
  apiKey?: string; // Optional per-model custom key
  apiEndpoint?: string; // Optional custom endpoint
  temperature?: number;
  tierRequired?: string;
  isActive: boolean;
  isDefault?: boolean;
  orderIndex?: number;
}

export const DEFAULT_AI_MODELS: AIModelDefinition[] = [
  {
    id: "gpt-6-luna",
    displayName: "NzoOpen 6 Luna",
    provider: "openai",
    description: "Next-gen OpenAI GPT-6 Luna intelligence with native tool reasoning, ultra-fast synthesis, and low token cost.",
    badge: "Latest Default",
    category: "reasoning",
    isActive: true,
    isDefault: true,
    orderIndex: 1,
  },
  {
    id: "gpt-4o",
    displayName: "NzoOpen 4 Basic",
    provider: "openai",
    description: "Full-capability multimodal intelligence for intricate inquiries and analysis.",
    badge: "Flagship",
    category: "balanced",
    isActive: true,
    isDefault: false,
    orderIndex: 2,
  },
  {
    id: "gemini-2.0-flash",
    displayName: "NzoGem 3 Cool",
    provider: "google",
    description: "Next-generation Google Gemini speed, deep context understanding, and rapid generation.",
    badge: "Ultra Fast",
    category: "fast",
    isActive: true,
    isDefault: false,
    orderIndex: 3,
  },
  {
    id: "gemini-1.5-pro",
    displayName: "NzoGem 3 Pro",
    provider: "google",
    description: "Massive context window with advanced reasoning for deep knowledge base synthesis.",
    badge: "High Reasoning",
    category: "reasoning",
    isActive: true,
    isDefault: false,
    orderIndex: 4,
  },
  {
    id: "claude-3-5-sonnet",
    displayName: "NzoClaude 3 Smart",
    provider: "anthropic",
    description: "Nuanced, natural conversational tone with exceptional comprehension.",
    badge: "Nuanced",
    category: "pro",
    isActive: true,
    isDefault: false,
    orderIndex: 5,
  },
  {
    id: "gpt-4o-mini",
    displayName: "NzoOpen Mini Fast",
    provider: "openai",
    description: "Lightweight conversational support model for simple FAQ deflection.",
    badge: "Legacy Light",
    category: "fast",
    isActive: true,
    isDefault: false,
    orderIndex: 6,
  },
];

let cachedModels: AIModelDefinition[] = [...DEFAULT_AI_MODELS];

export async function fetchPlatformModelsFromDB(): Promise<AIModelDefinition[]> {
  try {
    const rows = await db.query.aiModel.findMany({
      orderBy: [asc(aiModel.orderIndex)],
    });

    if (rows && rows.length > 0) {
      cachedModels = rows.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        provider: (r.provider || "openai") as any,
        description: r.description,
        badge: r.badge || undefined,
        category: r.category || "standard",
        apiKey: r.apiKey || undefined,
        apiEndpoint: r.apiEndpoint || undefined,
        temperature: r.temperature || 70,
        tierRequired: r.tierRequired || "all",
        isActive: r.isActive,
        isDefault: r.isDefault,
        orderIndex: r.orderIndex,
      }));
      return cachedModels;
    }
  } catch (err) {
    console.warn("[ai/models] Could not read ai_model table from DB, using fallback cache:", err);
  }

  return cachedModels;
}

export function getPlatformModels(): AIModelDefinition[] {
  return cachedModels;
}

export function getActivePlatformModels(): AIModelDefinition[] {
  return cachedModels.filter((m) => m.isActive);
}

export function updatePlatformModels(updated: AIModelDefinition[]) {
  if (Array.isArray(updated) && updated.length > 0) {
    cachedModels = updated;
  }
}
