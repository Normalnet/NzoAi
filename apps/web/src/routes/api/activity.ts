import { createServerFileRoute } from "@/lib/server-route";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { lead, feedback, issueReport } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/activity").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ activities: [] }), { headers: { "Content-Type": "application/json" } });
      }

      let leadsList: any[] = [];
      let feedbackList: any[] = [];
      let issuesList: any[] = [];

      try {
        const res = await Promise.all([
          db.query.lead.findMany({
            where: eq(lead.chatbotId, activeBotId),
            orderBy: [desc(lead.createdAt)],
            limit: 50,
          }),
          db.query.feedback.findMany({
            where: eq(feedback.chatbotId, activeBotId),
            orderBy: [desc(feedback.createdAt)],
            limit: 50,
          }),
          db.query.issueReport.findMany({
            where: eq(issueReport.chatbotId, activeBotId),
            orderBy: [desc(issueReport.createdAt)],
            limit: 50,
          }),
        ]);
        leadsList = res[0] || [];
        feedbackList = res[1] || [];
        issuesList = res[2] || [];
      } catch (dbErr) {
        // fallback empty lists if db query fails
      }

      const activities = [
        ...leadsList.map((item) => ({ ...item, type: "lead" })),
        ...feedbackList.map((item) => ({ ...item, type: "feedback" })),
        ...issuesList.map((item) => ({ ...item, type: "issue" })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return new Response(JSON.stringify({ activities }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
