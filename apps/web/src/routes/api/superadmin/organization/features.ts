import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { organization } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/organization/features").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { organizationId, features, customLimits } = body;

      if (!organizationId) {
        return new Response(JSON.stringify({ error: "organizationId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      if (!org) {
        return new Response(JSON.stringify({ error: "Organization not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let currentMeta: any = {};
      try {
        if (org.metadata) {
          currentMeta = typeof org.metadata === "string" ? JSON.parse(org.metadata) : org.metadata;
        }
      } catch (e) {}

      const updatedMeta = {
        ...currentMeta,
        features: {
          ...(currentMeta.features || {}),
          ...(features || {}),
        },
        customLimits: {
          ...(currentMeta.customLimits || {}),
          ...(customLimits || {}),
        },
      };

      await db
        .update(organization)
        .set({ metadata: JSON.stringify(updatedMeta) })
        .where(eq(organization.id, organizationId));

      return new Response(
        JSON.stringify({
          success: true,
          message: `Features updated for "${org.name}".`,
          metadata: updatedMeta,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
