import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../../middlewares/auth";
import { db } from "../../../../db";
import { organization, subscription, creditsUsage, chatbot } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const ServerRoute = createServerFileRoute("/api/superadmin/organization/create").methods({
  POST: async ({ request }) => {
    try {
      const session = await requireSuperAdmin(request);
      const body = await request.json();
      const { name, slug, planTier = "enterprise", initialCredits = 5000, createDefaultBot = true } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: "Organization name is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const generatedSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim();
      const orgId = `org_${uuidv4().slice(0, 10)}`;

      // 1. Insert Organization
      await db.insert(organization).values({
        id: orgId,
        name: name.trim(),
        slug: generatedSlug,
        chatbotCount: createDefaultBot ? 1 : 0,
        metadata: JSON.stringify({
          features: {
            allowWebsiteCrawl: true,
            allowCustomBranding: true,
            allowLiveEscalation: true,
            allowDocumentUploads: true,
            allowMultiModel: true,
          },
        }),
        createdAt: new Date(),
      });

      // 2. Assign Subscription Tier
      await db.insert(subscription).values({
        id: `sub_${uuidv4().slice(0, 8)}`,
        userId: session.user.id,
        referenceId: orgId,
        status: "active",
        productId: planTier,
        amount: 0,
        currency: "ghs",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Allocate Initial Message Credits
      if (initialCredits > 0) {
        await db.insert(creditsUsage).values({
          id: `cred_${uuidv4().slice(0, 8)}`,
          userId: session.user.id,
          creditCount: initialCredits,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date(),
        });
      }

      // 4. Optionally Create Initial Chatbot
      let bot = null;
      if (createDefaultBot) {
        const botId = `bot_${uuidv4().slice(0, 10)}`;
        await db.insert(chatbot).values({
          id: botId,
          organizationId: orgId,
          name: `${name.trim()} Support Agent`,
          primaryColor: "#800020",
          theme: "light",
          personality: "support",
          initialMessage: `Hello! Welcome to ${name.trim()}. How can we assist you today?`,
          suggestedMessages: ["Tell me about your services", "How can I get support?"],
          trainingStatus: "idle",
          embedToken: `embed_${uuidv4().slice(0, 8)}`,
          isEmbeddingEnabled: true,
          allowedDomains: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        bot = await db.query.chatbot.findFirst({
          where: eq(chatbot.id, botId),
        });
      }

      const createdOrg = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Workspace "${createdOrg?.name}" created successfully.`,
          organization: createdOrg,
          chatbot: bot,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
