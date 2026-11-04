import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { user } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/user/delete").methods({
  POST: async ({ request }) => {
    try {
      const session = await requireSuperAdmin(request);
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (userId === session.user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own superadmin account." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.delete(user).where(eq(user.id, userId));

      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${userId} deleted successfully.`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
