import { tool } from "ai";
import { z } from "zod";
import { findBestActionMatch, type ActionItem } from "../../utils/action-matching";

export function createCalBookingTool(actions: ActionItem[]) {
  return tool({
    description: "Display an appointment booking widget for Calendly or Cal.com so visitors can schedule a meeting.",
    parameters: z.object({
      userIntent: z.string().describe("The user's meeting request or availability inquiry"),
    }),
    execute: async ({ userIntent }) => {
      const match = findBestActionMatch(userIntent, actions);
      return {
        actionId: match?.id,
        title: match?.name || "Schedule a Meeting",
        url: match?.actionProperties?.url || "",
        eventTypeId: match?.actionProperties?.eventTypeId,
        provider: match?.toolName.includes("calendly") ? "calendly" : "cal",
      };
    },
  });
}
