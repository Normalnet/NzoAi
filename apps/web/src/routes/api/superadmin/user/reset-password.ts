import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { user, account } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "better-auth/crypto";

export const ServerRoute = createServerFileRoute("/api/superadmin/user/reset-password").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        return new Response(
          JSON.stringify({ error: "userId and newPassword are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const targetUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        return new Response(JSON.stringify({ error: "User not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const hashedPassword = await hashPassword(newPassword);

      const existingAccount = await db.query.account.findFirst({
        where: and(eq(account.userId, userId), eq(account.providerId, "credential")),
      });

      if (existingAccount) {
        await db
          .update(account)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(account.id, existingAccount.id));
      } else {
        await db.insert(account).values({
          id: uuidv4(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Password for ${targetUser.email} has been updated successfully.`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
