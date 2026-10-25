import { tool } from "ai";
import { z } from "zod";

export function createCollectFeedbackTool() {
  return tool({
    description: "Present an interactive feedback form to the visitor to rate their experience or provide feedback.",
    parameters: z.object({
      prompt: z.string().optional().describe("A polite prompt asking for the user's feedback"),
    }),
    // Client-side tool: returns metadata for UI to render
    execute: async ({ prompt }) => {
      return {
        prompt: prompt || "We'd love to hear your feedback on how we can improve!",
        showForm: true,
      };
    },
  });
}
