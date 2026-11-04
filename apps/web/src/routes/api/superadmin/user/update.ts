import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { user } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/user/update").methods({
  POST: async ({ request }) => {
    try {
      const session = await requireSuperAdmin(request);
      const body = await request.json();
      const { userId, role, name } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updateData: any = { updatedAt: new Date() };
      if (role && (role === "user" || role === "superadmin")) {
        updateData.role = role;
      }
      if (name && typeof name === "string") {
        updateData.name = name.trim();
      }

      await db.update(user).set(updateData).where(eq(user.id, userId));

      const updatedUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${updatedUser?.email || userId} updated successfully.`,
          user: updatedUser,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
