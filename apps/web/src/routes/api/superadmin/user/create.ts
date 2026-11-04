import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { user, account, member, organization } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "better-auth/crypto";

export const ServerRoute = createServerFileRoute("/api/superadmin/user/create").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { name, email, password, role = "user", organizationId, orgRole = "member" } = body;

      if (!name || !email || !password) {
        return new Response(
          JSON.stringify({ error: "Name, email, and password are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists
      const existing = await db.query.user.findFirst({
        where: eq(user.email, email.trim().toLowerCase()),
      });

      if (existing) {
        return new Response(
          JSON.stringify({ error: `A user with email "${email}" already exists.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      const newUserId = `usr_${uuidv4().slice(0, 12)}`;
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Create User Row
      await db.insert(user).values({
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: true,
        role: role === "superadmin" ? "superadmin" : "user",
        isSubscribed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Hash Password and Create Account Row
      const hashedPassword = await hashPassword(password);
      await db.insert(account).values({
        id: uuidv4(),
        accountId: newUserId,
        providerId: "credential",
        userId: newUserId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Optional: Link to Organization Membership
      if (organizationId) {
        const org = await db.query.organization.findFirst({
          where: eq(organization.id, organizationId),
        });
        if (org) {
          await db.insert(member).values({
            id: `mem_${uuidv4().slice(0, 10)}`,
            organizationId,
            userId: newUserId,
            role: orgRole,
            createdAt: new Date(),
          });
        }
      }

      const created = await db.query.user.findFirst({
        where: eq(user.id, newUserId),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${normalizedEmail} created successfully.`,
          user: created,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
