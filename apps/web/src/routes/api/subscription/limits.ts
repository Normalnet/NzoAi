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
      const orgId = session.session?.activeOrganizationId || "dev_org_01";

      let dbUser: any = null;
      let membership: any = null;

      try {
        if (session.user?.id) {
          dbUser = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
          });
          membership = await db.query.member.findFirst({
            where: and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)),
          });
        }
      } catch (dbErr) {
        // DB uninitialized in dev
      }

      const superadmin = isSuperAdmin({
        id: session.user?.id,
        email: session.user?.email,
        role: dbUser?.role || session.user?.role,
      });

      // 3. Fetch plan tier & quotas
      let plan: any = {
        id: "starter",
        name: "Starter",
        monthlyCredits: 1000,
        allowWebsiteCrawl: false,
        allowCustomBranding: false,
      };
      let botLimits: any = { current: 1, max: 1, allowed: false };
      let memberLimits: any = { current: 1, max: 2, allowed: true };

      try {
        plan = await getOrganizationPlan(orgId);
        botLimits = await checkChatbotCreationLimit(orgId);
        memberLimits = await checkMemberInvitationLimit(orgId);
      } catch (tierErr) {
        // fallback limits
      }

      return new Response(
        JSON.stringify({
          isSuperAdmin: superadmin,
          role: membership?.role || (superadmin ? "owner" : "owner"),
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
