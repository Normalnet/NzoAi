import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { action } from "../../db/schema";
import type { ActionItem } from "../utils/action-matching";

export const VALID_TOOL_NAMES = [
  "knowledge_base",
  "collect_feedback",
  "escalate_to_human",
  "collect_leads",
  "custom_button",
  "calendly_booking",
  "cal_booking",
  "caldotcom",
] as const;

export async function getActiveActionsForChatbot(chatbotId: string): Promise<Record<string, ActionItem[]>> {
  const actionsList = await db.query.action.findMany({
    where: and(eq(action.chatbotId, chatbotId), eq(action.isActive, true)),
  });

  const map: Record<string, ActionItem[]> = {};

  for (const act of actionsList) {
    const toolName = act.toolName === "caldotcom" ? "cal_booking" : act.toolName;
    if (!map[toolName]) {
      map[toolName] = [];
    }
    map[toolName].push({
      id: act.id,
      toolName: act.toolName,
      name: act.name,
      description: act.description,
      isActive: act.isActive,
      showInQuickMenu: act.showInQuickMenu,
      actionProperties: (act.actionProperties as Record<string, any>) || {},
    });
  }

  return map;
}
