import { createServerFileRoute } from "@/lib/server-route";
import { requireAuthSession, isSuperAdmin } from "../../../middlewares/auth";
import { getOrganizationPlan, checkChatbotCreationLimit, checkMemberInvitationLimit } from "../../../lib/subscription/tier-limits";
import { db } from "../../../db";
import { member, user } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/subscription/limits").methods({
  GET: async ({ request }) => {
    try {
      const session = await requireAuthSession(request);
      const orgId = session.session.activeOrganizationId;

      if (!orgId) {
        return new Response(JSON.stringify({ error: "No active organization" }), { status: 400 });
      }

      // 1. Fetch user DB profile
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });

      const superadmin = isSuperAdmin({
        id: session.user.id,
        email: session.user.email,
        role: dbUser?.role || session.user.role,
      });

      // 2. Fetch membership in active org
      const membership = await db.query.member.findFirst({
        where: and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)),
      });

      // 3. Fetch plan tier & quotas
      const plan = await getOrganizationPlan(orgId);
      const botLimits = await checkChatbotCreationLimit(orgId);
      const memberLimits = await checkMemberInvitationLimit(orgId);

      return new Response(
        JSON.stringify({
          isSuperAdmin: superadmin,
          role: membership?.role || (superadmin ? "superadmin" : "member"),
          plan: {
            id: plan.id,
            name: plan.name,
            monthlyCredits: plan.monthlyCredits,
            allowWebsiteCrawl: plan.allowWebsiteCrawl,
            allowCustomBranding: plan.allowCustomBranding,
          },
          usage: {
            chatbots: {
              current: botLimits.current,
              max: superadmin ? 9999 : botLimits.max,
              canCreateMore: superadmin ? true : botLimits.allowed,
            },
            members: {
              current: memberLimits.current,
              max: superadmin ? 9999 : memberLimits.max,
              canInviteMore: superadmin ? true : memberLimits.allowed,
            },
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
