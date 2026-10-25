import { createServerFileRoute } from "@/lib/server-route";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { chatbot } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/chatbot-count").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const orgId = authSession.session.activeOrganizationId;

      if (!orgId) {
        return new Response(JSON.stringify({ count: 0 }), { headers: { "Content-Type": "application/json" } });
      }

      const res = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatbot)
        .where(eq(chatbot.organizationId, orgId));

      return new Response(JSON.stringify({ count: Number(res[0]?.count ?? 0) }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
