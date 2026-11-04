export interface AIModelDefinition {
  id: string; // Underlying provider model id (e.g., "gpt-4o", "gemini-2.0-flash")
  displayName: string; // White-label brand name (e.g., "NzoOpen 4 Basic", "NzoGem 3 Cool")
  provider: "openai" | "google" | "anthropic" | "meta" | "custom";
  description: string;
  badge?: string; // "Recommended", "Ultra Fast", "Flagship"
  isActive: boolean;
  isDefault?: boolean;
}

export const DEFAULT_AI_MODELS: AIModelDefinition[] = [
  {
    id: "gpt-4o-mini",
    displayName: "NzoOpen Mini Fast",
    provider: "openai",
    description: "Ultra-fast response latency with high precision for conversational support.",
    badge: "Fast & Light",
    isActive: true,
    isDefault: true,
  },
  {
    id: "gpt-4o",
    displayName: "NzoOpen 4 Basic",
    provider: "openai",
    description: "Full-capability multimodal intelligence for intricate inquiries and analysis.",
    badge: "Flagship",
    isActive: true,
  },
  {
    id: "gemini-2.0-flash",
    displayName: "NzoGem 3 Cool",
    provider: "google",
    description: "Next-generation Google Gemini speed, deep context understanding, and rapid generation.",
    badge: "Popular",
    isActive: true,
  },
  {
    id: "gemini-1.5-pro",
    displayName: "NzoGem 3 Pro",
    provider: "google",
    description: "Massive context window with advanced reasoning for deep knowledge base synthesis.",
    badge: "High Reasoning",
    isActive: true,
  },
  {
    id: "claude-3-5-sonnet",
    displayName: "NzoClaude 3 Smart",
    provider: "anthropic",
    description: "Nuanced, natural conversational tone with exceptional comprehension.",
    badge: "Nuanced",
    isActive: true,
  },
];

// In-memory runtime catalog that can be updated dynamically via Superadmin UI
let dynamicModels: AIModelDefinition[] = [...DEFAULT_AI_MODELS];

export function getPlatformModels(): AIModelDefinition[] {
  return dynamicModels;
}

export function getActivePlatformModels(): AIModelDefinition[] {
  return dynamicModels.filter((m) => m.isActive);
}

export function updatePlatformModels(updated: AIModelDefinition[]) {
  if (Array.isArray(updated) && updated.length > 0) {
    dynamicModels = updated;
  }
}
