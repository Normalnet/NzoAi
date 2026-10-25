import { tool } from "ai";
import { z } from "zod";
import { findBestActionMatch, type ActionItem } from "../../utils/action-matching";

export function createCollectLeadsTool(actions: ActionItem[]) {
  return tool({
    description: "Display a lead capture form to gather contact information from interested visitors.",
    parameters: z.object({
      userIntent: z.string().describe("The user's stated topic or area of interest"),
    }),
    execute: async ({ userIntent }) => {
      const match = findBestActionMatch(userIntent, actions);
      return {
        actionId: match?.id,
        title: match?.name || "Get in touch with us",
        description: match?.description || "Leave your details and our team will get back to you.",
        properties: match?.actionProperties || {},
        showForm: true,
      };
    },
  });
}
