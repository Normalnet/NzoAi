import { eq } from "drizzle-orm";
import { db } from "../db";
import { subscription } from "../db/schema";
import { ChatSDKError } from "../lib/errors";

export async function checkSubscription(organizationId: string) {
  if (!organizationId) return false;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.referenceId, organizationId),
  });

  if (!sub) {
    // In dev mode allow if no polar credentials set
    if (process.env.NODE_ENV === "development" && !process.env.POLAR_ACCESS_TOKEN) {
      return true;
    }
    return false;
  }

  if (sub.status === "active") {
    return true;
  }

  if (sub.status === "trialing" && sub.periodEnd && new Date(sub.periodEnd) > new Date()) {
    return true;
  }

  return false;
}

export async function requireSubscription(organizationId: string) {
  const isSubscribed = await checkSubscription(organizationId);
  if (!isSubscribed) {
    throw new ChatSDKError(
      "forbidden:subscription",
      "An active organization subscription is required to perform this action.",
      403
    );
  }
}
