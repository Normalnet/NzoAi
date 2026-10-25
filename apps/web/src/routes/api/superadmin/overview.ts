import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../middlewares/auth";
import { db } from "../../../db";
import { user, organization, chatbot, chat, subscription, member } from "../../../db/schema";
import { count, desc } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/overview").methods({
  GET: async ({ request }) => {
    try {
      // Enforce strict Platform Superadmin authorization
      const session = await requireSuperAdmin(request);

      const [
        totalUsers,
        totalOrgs,
        totalBots,
        totalChats,
        totalSubscriptions,
        recentOrgs,
      ] = await Promise.all([
        db.select({ count: count() }).from(user),
        db.select({ count: count() }).from(organization),
        db.select({ count: count() }).from(chatbot),
        db.select({ count: count() }).from(chat),
        db.select({ count: count() }).from(subscription),
        db.query.organization.findMany({
          orderBy: [desc(organization.createdAt)],
          limit: 20,
        }),
      ]);

      return new Response(
        JSON.stringify({
          superadmin: session.user.email,
          metrics: {
            usersCount: totalUsers[0]?.count || 0,
            organizationsCount: totalOrgs[0]?.count || 0,
            chatbotsCount: totalBots[0]?.count || 0,
            conversationsCount: totalChats[0]?.count || 0,
            subscriptionsCount: totalSubscriptions[0]?.count || 0,
          },
          recentOrganizations: recentOrgs,
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
