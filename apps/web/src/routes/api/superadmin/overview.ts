import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../middlewares/auth";
import { db } from "../../../db";
import { user, organization, chatbot, chat, subscription, member } from "../../../db/schema";
import { count, desc, eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/overview").methods({
  GET: async ({ request }) => {
    try {
      // If visited directly via a web browser (Accept includes text/html), redirect to the graphical Superadmin UI portal
      const acceptHeader = request.headers.get("accept") || "";
      if (acceptHeader.includes("text/html")) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/superadmin",
          },
        });
      }

      // Enforce strict Platform Superadmin authorization
      const session = await requireSuperAdmin(request);

      let metrics = {
        usersCount: 1,
        organizationsCount: 1,
        chatbotsCount: 1,
        conversationsCount: 0,
        subscriptionsCount: 1,
      };

      let allOrgs: any[] = [];
      let allUsers: any[] = [];
      let allChatbots: any[] = [];

      try {
        const [
          totalUsers,
          totalOrgs,
          totalBots,
          totalChats,
          totalSubscriptions,
          fetchedOrgs,
          fetchedUsers,
          fetchedBots,
          fetchedSubs,
        ] = await Promise.all([
          db.select({ count: count() }).from(user),
          db.select({ count: count() }).from(organization),
          db.select({ count: count() }).from(chatbot),
          db.select({ count: count() }).from(chat),
          db.select({ count: count() }).from(subscription),
          db.query.organization.findMany({
            orderBy: [desc(organization.createdAt)],
            limit: 100,
          }),
          db.query.user.findMany({
            orderBy: [desc(user.createdAt)],
            limit: 100,
          }),
          db.query.chatbot.findMany({
            orderBy: [desc(chatbot.createdAt)],
            limit: 100,
          }),
          db.query.subscription.findMany({
            orderBy: [desc(subscription.createdAt)],
            limit: 100,
          }),
        ]);

        metrics = {
          usersCount: totalUsers[0]?.count || 1,
          organizationsCount: totalOrgs[0]?.count || 1,
          chatbotsCount: totalBots[0]?.count || 1,
          conversationsCount: totalChats[0]?.count || 0,
          subscriptionsCount: totalSubscriptions[0]?.count || 1,
        };

        // Map plan tiers from subscriptions to organizations
        const subByOrgId: Record<string, any> = {};
        for (const sub of fetchedSubs) {
          if (sub.referenceId) {
            subByOrgId[sub.referenceId] = sub;
          }
        }

        allOrgs = fetchedOrgs.map((org) => {
          const sub = subByOrgId[org.id];
          return {
            ...org,
            planTier: sub?.productId || "starter",
            subStatus: sub?.status || "active",
          };
        });

        allUsers = fetchedUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        }));

        allChatbots = fetchedBots.map((bot) => {
          const org = fetchedOrgs.find((o) => o.id === bot.organizationId);
          return {
            ...bot,
            organizationName: org?.name || "Unknown Workspace",
          };
        });
      } catch (dbErr) {
        console.warn("[superadmin] Database query error:", dbErr);
      }

      return new Response(
        JSON.stringify({
          superadmin: session.user.email,
          metrics,
          organizations: allOrgs,
          users: allUsers,
          chatbots: allChatbots,
          platformSettings: {
            openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
            paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
            firecrawlConfigured: Boolean(process.env.FIRECRAWL_API_KEY),
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            superadminEmails: process.env.SUPERADMIN_EMAILS || "founder@nzoai.com,admin@nzoai.com",
            version: "2.4.0-enterprise",
          },
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
