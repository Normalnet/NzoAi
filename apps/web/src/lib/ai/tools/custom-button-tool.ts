import { tool } from "ai";
import { z } from "zod";
import { findBestActionMatch, type ActionItem } from "../../utils/action-matching";

export function createCustomButtonTool(actions: ActionItem[]) {
  return tool({
    description: "Display an action button with a custom label and link (e.g., download a resource, view pricing, or visit a URL).",
    parameters: z.object({
      userIntent: z.string().describe("The user's query or intent to match with available action buttons"),
    }),
    execute: async ({ userIntent }) => {
      const match = findBestActionMatch(userIntent, actions);
      return {
        actionId: match?.id,
        label: match?.name || "Learn More",
        url: match?.actionProperties?.url || "https://nzoai.com",
        description: match?.description,
      };
    },
  });
}
