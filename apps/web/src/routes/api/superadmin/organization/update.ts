import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { organization, subscription, creditsUsage } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const ServerRoute = createServerFileRoute("/api/superadmin/organization/update").methods({
  POST: async ({ request }) => {
    try {
      const session = await requireSuperAdmin(request);
      const body = await request.json();
      const { organizationId, name, slug, planTier, grantCredits } = body;

      if (!organizationId) {
        return new Response(JSON.stringify({ error: "organizationId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 1. Update basic org info
      const updateData: any = {};
      if (name && typeof name === "string") updateData.name = name.trim();
      if (slug && typeof slug === "string") updateData.slug = slug.trim().toLowerCase();

      if (Object.keys(updateData).length > 0) {
        await db.update(organization).set(updateData).where(eq(organization.id, organizationId));
      }

      // 2. Override Subscription Plan Tier
      if (planTier && ["starter", "growth", "pro", "enterprise"].includes(planTier)) {
        const existingSub = await db.query.subscription.findFirst({
          where: eq(subscription.referenceId, organizationId),
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
            referenceId: organizationId,
            status: "active",
            productId: planTier,
            amount: 0,
            currency: "ghs",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // 3. Grant Message Credits
      if (typeof grantCredits === "number" && grantCredits > 0) {
        await db.insert(creditsUsage).values({
          id: `cred_${uuidv4().slice(0, 8)}`,
          userId: session.user.id,
          creditCount: grantCredits,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date(),
        });
      }

      const updated = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Workspace "${updated?.name || organizationId}" updated successfully by Superadmin.`,
          organization: updated,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
