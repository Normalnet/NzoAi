import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { organization } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/organization/delete").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { organizationId } = body;

      if (!organizationId) {
        return new Response(JSON.stringify({ error: "organizationId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Foreign key cascades clean up chatbots, members, invitations, etc.
      await db.delete(organization).where(eq(organization.id, organizationId));

      return new Response(
        JSON.stringify({
          success: true,
          message: `Organization ${organizationId} and all associated resources deleted successfully.`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
