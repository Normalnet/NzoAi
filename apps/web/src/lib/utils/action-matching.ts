export interface ActionItem {
  id: string;
  toolName: string;
  name: string;
  description: string;
  isActive: boolean;
  showInQuickMenu?: boolean;
  actionProperties?: Record<string, any>;
}

export function findBestActionMatch(
  userIntent: string,
  actions: ActionItem[]
): ActionItem | null {
  if (!actions || actions.length === 0) return null;
  if (!userIntent) return actions[0] || null;

  const normalizedIntent = userIntent.toLowerCase().trim();
  let bestMatch: ActionItem | null = null;
  let highestScore = -1;

  for (const act of actions) {
    if (!act.isActive) continue;

    let score = 0;
    const name = act.name.toLowerCase().trim();
    const desc = act.description.toLowerCase().trim();

    // 1. Exact phrase containment between intent and description
    if (desc.includes(normalizedIntent) || normalizedIntent.includes(desc)) {
      score += 1000;
    }

    // 2. Exact phrase containment between intent and name
    if (name.includes(normalizedIntent) || normalizedIntent.includes(name)) {
      score += 750;
    }

    // 3. Keyword overlap
    const intentTokens = normalizedIntent.split(/\s+/).filter((t) => t.length > 2);
    const descTokens = desc.split(/\s+/).filter((t) => t.length > 2);
    const nameTokens = name.split(/\s+/).filter((t) => t.length > 2);

    let matchCount = 0;
    for (const token of intentTokens) {
      if (descTokens.includes(token)) matchCount += 2;
      if (nameTokens.includes(token)) matchCount += 3;
    }

    score += matchCount * 50;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = act;
    }
  }

  return highestScore > 0 ? bestMatch : actions[0] || null;
}
