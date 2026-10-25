import { createServerFileRoute } from "@/lib/server-route";
import { requireAuthSession } from "../../middlewares/auth";
import { checkFeatureAccess } from "../../lib/subscription/tier-limits";

export const ServerRoute = createServerFileRoute("/api/crawl").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const orgId = authSession.session.activeOrganizationId;
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId || !orgId) {
        return new Response(JSON.stringify({ error: "No active chatbot or organization selected" }), { status: 400 });
      }

      // Enforce Tier Feature Limit: Crawl is restricted to Growth and Pro tiers
      const featureCheck = await checkFeatureAccess(orgId, "crawl");
      if (!featureCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: featureCheck.error,
            tier: featureCheck.tier.name,
            feature: "crawl",
            upgradeRequired: true,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const { url, maxPages = 50 } = await request.json();
      if (!url) {
        return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
      }

      if (!process.env.FIRECRAWL_API_KEY) {
        return new Response(
          JSON.stringify({ error: "FIRECRAWL_API_KEY is not configured on this server" }),
          { status: 503 }
        );
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || "http://localhost:3001"}/api/firecrawl-webhook`;

      const crawlRes = await fetch("https://api.firecrawl.dev/v1/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          limit: maxPages,
          webhook: webhookUrl,
          scrapeOptions: { formats: ["markdown"] },
        }),
      });

      const data = await crawlRes.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
