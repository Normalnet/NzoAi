import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { organization, member, subscription, creditsUsage } from "../../db/schema";
import { requireAuthSession, isSuperAdmin } from "../../middlewares/auth";
import { getOrganizationPlan } from "../../lib/subscription/tier-limits";
import { v4 as uuidv4 } from "uuid";

export const ServerRoute = createServerFileRoute("/api/organization").methods({
  GET: async ({ request }) => {
    try {
      const session = await requireAuthSession(request);
      const activeOrgId = session.session?.activeOrganizationId || "dev_org_01";

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, activeOrgId),
      });

      const plan = await getOrganizationPlan(activeOrgId);
      const isSuper = isSuperAdmin(session.user);

      return new Response(
        JSON.stringify({
          organization: org || {
            id: activeOrgId,
            name: "NzoAI Workspace",
            slug: "nzoai-workspace",
            chatbotCount: 1,
            createdAt: new Date().toISOString(),
          },
          plan,
          isSuperAdmin: isSuper,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  PATCH: async ({ request }) => {
    try {
      const session = await requireAuthSession(request);
      const activeOrgId = session.session?.activeOrganizationId || "dev_org_01";
      const isSuper = isSuperAdmin(session.user);

      // Verify permission: User must be Superadmin or Org Owner/Admin
      if (!isSuper) {
        const membership = await db.query.member.findFirst({
          where: and(eq(member.userId, session.user.id), eq(member.organizationId, activeOrgId)),
        });
        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
          return new Response(
            JSON.stringify({ error: "Only organization owners, admins, or platform superadmins can edit settings." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const body = await request.json();
      const { name, slug, planTier, grantCredits } = body;

      // 1. Update Organization Details
      const updateData: any = {};
      if (name && typeof name === "string") updateData.name = name.trim();
      if (slug && typeof slug === "string") updateData.slug = slug.trim().toLowerCase();

      if (Object.keys(updateData).length > 0) {
        await db.update(organization).set(updateData).where(eq(organization.id, activeOrgId));
      }

      // 2. Superadmin Dynamic Overrides (Plan Tier and Credits)
      if (isSuper) {
        // Direct Plan Tier Override
        if (planTier && ["starter", "growth", "pro", "enterprise"].includes(planTier)) {
          const existingSub = await db.query.subscription.findFirst({
            where: eq(subscription.referenceId, activeOrgId),
          });

          if (existingSub) {
            await db
              .update(subscription)
              .set({
                productId: planTier,
                status: "active",
                updatedAt: new Date(),
              })
              .where(eq(subscription.id, existingSub.id));
          } else {
            await db.insert(subscription).values({
              id: `sub_admin_${uuidv4().slice(0, 8)}`,
              userId: session.user.id,
              referenceId: activeOrgId,
              status: "active",
              productId: planTier,
              amount: 0,
              currency: "ghs",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Direct Credit Grant
        if (typeof grantCredits === "number" && grantCredits > 0) {
          await db.insert(creditsUsage).values({
            id: `cred_${uuidv4().slice(0, 8)}`,
            userId: session.user.id,
            creditCount: grantCredits,
            date: new Date().toISOString().slice(0, 10),
            createdAt: new Date(),
          });
        }
      }

      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, activeOrgId),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Organization settings updated successfully.",
          organization: updatedOrg,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
