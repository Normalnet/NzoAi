import { eq, count } from "drizzle-orm";
import { db } from "../../db";
import { subscription, chatbot, member, organization } from "../../db/schema";

export type PlanTier = "starter" | "growth" | "pro" | "enterprise";

export interface TierConfig {
  id: PlanTier;
  name: string;
  maxChatbots: number;
  maxMembers: number;
  allowWebsiteCrawl: boolean;
  allowCustomBranding: boolean;
  monthlyCredits: number;
}

export const TIER_CONFIGS: Record<PlanTier, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    maxChatbots: 1,
    maxMembers: 2,
    allowWebsiteCrawl: false,
    allowCustomBranding: false,
    monthlyCredits: 1000,
  },
  growth: {
    id: "growth",
    name: "Growth",
    maxChatbots: 3,
    maxMembers: 5,
    allowWebsiteCrawl: true,
    allowCustomBranding: false,
    monthlyCredits: 5000,
  },
  pro: {
    id: "pro",
    name: "Professional",
    maxChatbots: 5,
    maxMembers: 10,
    allowWebsiteCrawl: true,
    allowCustomBranding: true,
    monthlyCredits: 25000,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    maxChatbots: 100,
    maxMembers: 100,
    allowWebsiteCrawl: true,
    allowCustomBranding: true,
    monthlyCredits: 1000000,
  },
};

/**
 * Resolves the active plan tier for an organization.
 */
export async function getOrganizationPlan(organizationId: string): Promise<TierConfig> {
  if (!organizationId) return TIER_CONFIGS.starter;

  // Query active subscription for this organization
  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.referenceId, organizationId),
  });

  if (!sub) {
    // In local development allow Growth plan as fallback
    if (process.env.NODE_ENV === "development" && !process.env.POLAR_ACCESS_TOKEN) {
      return TIER_CONFIGS.growth;
    }
    return TIER_CONFIGS.starter;
  }

  // Check if subscription is in good standing
  const isActive =
    sub.status === "active" ||
    (sub.status === "trialing" && sub.periodEnd && new Date(sub.periodEnd) > new Date());

  if (!isActive) {
    return TIER_CONFIGS.starter;
  }

  // Match tier from productId or meters
  const prodId = (sub.productId || "").toLowerCase();
  if (prodId.includes("pro") || prodId.includes("professional")) {
    return TIER_CONFIGS.pro;
  }
  if (prodId.includes("growth")) {
    return TIER_CONFIGS.growth;
  }
  if (prodId.includes("enterprise")) {
    return TIER_CONFIGS.enterprise;
  }

  return TIER_CONFIGS.starter;
}

/**
 * Check if the organization is permitted to create another chatbot under its plan tier.
 */
export async function checkChatbotCreationLimit(organizationId: string): Promise<{
  allowed: boolean;
  current: number;
  max: number;
  tier: TierConfig;
  error?: string;
}> {
  const tier = await getOrganizationPlan(organizationId);

  // Count active chatbots for this organization
  const botCountResult = await db
    .select({ count: count() })
    .from(chatbot)
    .where(eq(chatbot.organizationId, organizationId));

  const currentCount = botCountResult[0]?.count || 0;

  if (currentCount >= tier.maxChatbots) {
    return {
      allowed: false,
      current: currentCount,
      max: tier.maxChatbots,
      tier,
      error: `Plan limit reached: The ${tier.name} tier allows a maximum of ${tier.maxChatbots} chatbot(s). Current: ${currentCount}. Please upgrade your tier to add more.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    max: tier.maxChatbots,
    tier,
  };
}

/**
 * Check if the organization is permitted to invite another team member under its plan tier.
 */
export async function checkMemberInvitationLimit(organizationId: string): Promise<{
  allowed: boolean;
  current: number;
  max: number;
  tier: TierConfig;
  error?: string;
}> {
  const tier = await getOrganizationPlan(organizationId);

  // Count active members in this organization
  const memberCountResult = await db
    .select({ count: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  const currentCount = memberCountResult[0]?.count || 0;

  if (currentCount >= tier.maxMembers) {
    return {
      allowed: false,
      current: currentCount,
      max: tier.maxMembers,
      tier,
      error: `Plan limit reached: The ${tier.name} tier allows a maximum of ${tier.maxMembers} team seat(s). Current: ${currentCount}. Please upgrade your tier to invite more members.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    max: tier.maxMembers,
    tier,
  };
}

/**
 * Check if the organization's plan allows a specific advanced feature.
 */
export async function checkFeatureAccess(
  organizationId: string,
  feature: "crawl" | "branding"
): Promise<{ allowed: boolean; tier: TierConfig; error?: string }> {
  const tier = await getOrganizationPlan(organizationId);

  if (feature === "crawl" && !tier.allowWebsiteCrawl) {
    return {
      allowed: false,
      tier,
      error: `The ${tier.name} tier only supports single-page web scraping. Full recursive website crawling requires the Growth or Professional tier.`,
    };
  }

  if (feature === "branding" && !tier.allowCustomBranding) {
    return {
      allowed: false,
      tier,
      error: `Custom branding and powered-by badge removal is an exclusive feature of the Professional tier.`,
    };
  }

  return { allowed: true, tier };
}
