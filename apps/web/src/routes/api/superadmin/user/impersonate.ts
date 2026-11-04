import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { session, member, chatbot, user } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

export const ServerRoute = createServerFileRoute("/api/superadmin/user/impersonate").methods({
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const targetUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        return new Response(JSON.stringify({ error: "Target user not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Find user's organization and chatbot
      let activeOrgId: string | undefined = undefined;
      let activeBotId: string | undefined = undefined;

      const membership = await db.query.member.findFirst({
        where: eq(member.userId, userId),
      });

      if (membership) {
        activeOrgId = membership.organizationId;
        const bot = await db.query.chatbot.findFirst({
          where: eq(chatbot.organizationId, membership.organizationId),
        });
        if (bot) activeBotId = bot.id;
      }

      // Create new session token for the target user
      const sessionId = uuidv4();
      const sessionToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(session).values({
        id: sessionId,
        token: sessionToken,
        userId: targetUser.id,
        expiresAt,
        activeOrganizationId: activeOrgId,
        activeChatbotId: activeBotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = new Response(
        JSON.stringify({
          success: true,
          message: `Impersonating ${targetUser.email}. Redirecting to tenant dashboard...`,
          redirectUrl: "/admin/overview",
        }),
        { headers: { "Content-Type": "application/json" } }
      );

      // Set session cookie for seamless takeover
      response.headers.append(
        "Set-Cookie",
        `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      );

      return response;
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
