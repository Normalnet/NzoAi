import { createKnowledgeBaseTool } from "./tools/knowledge-base-tool";
import { createCollectFeedbackTool } from "./tools/collect-feedback-tool";
import { createEscalateToHumanTool } from "./tools/escalate-to-human-tool";
import { createCollectLeadsTool } from "./tools/collect-leads-tool";
import { createCustomButtonTool } from "./tools/custom-button-tool";
import { createCalBookingTool } from "./tools/cal-booking-tool";
import type { ActionItem } from "../utils/action-matching";

export function buildActiveTools(
  chatId: string,
  chatbotId: string,
  actionsMap: Record<string, ActionItem[]>
) {
  const tools: Record<string, any> = {
    // Core tools (always present)
    knowledge_base: createKnowledgeBaseTool(chatbotId),
    collect_feedback: createCollectFeedbackTool(),
    escalate_to_human: createEscalateToHumanTool(chatId, chatbotId),
  };

  // Configurable action tools
  if (actionsMap["collect_leads"]?.length) {
    tools.collect_leads = createCollectLeadsTool(actionsMap["collect_leads"]);
  }

  if (actionsMap["custom_button"]?.length) {
    tools.custom_button = createCustomButtonTool(actionsMap["custom_button"]);
  }

  if (actionsMap["cal_booking"]?.length || actionsMap["calendly_booking"]?.length) {
    const bookingActions = [
      ...(actionsMap["cal_booking"] || []),
      ...(actionsMap["calendly_booking"] || []),
    ];
    tools.cal_booking = createCalBookingTool(bookingActions);
  }

  return tools;
}
