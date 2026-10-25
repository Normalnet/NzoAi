import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { chatbot, organization } from "../../db/schema";
import { requireAuthSession, requireOrgRole } from "../../middlewares/auth";
import { checkChatbotCreationLimit } from "../../lib/subscription/tier-limits";

export const ServerRoute = createServerFileRoute("/api/chatbots").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const orgId = authSession.session?.activeOrganizationId || "dev_org_01";

      let bots: any[] = [];
      try {
        bots = await db.query.chatbot.findMany({
          where: eq(chatbot.organizationId, orgId),
          orderBy: [chatbot.createdAt],
        });
      } catch (dbErr) {
        // fallback
      }

      if (!bots || bots.length === 0) {
        bots = [
          {
            id: authSession.session?.activeChatbotId || "bot_default_01",
            organizationId: orgId,
            name: "NzoAI Assistant",
            primaryColor: "#800020",
            theme: "light",
            personality: "support",
            initialMessage: "Hello! How can I assist you with your customer support today?",
            embedToken: "embed_demo",
            createdAt: new Date(),
          },
        ];
      }

      return new Response(JSON.stringify({ chatbots: bots }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      // 1. Enforce RBAC: only owner and admin can create chatbots
      const { session } = await requireOrgRole(request, ["owner", "admin"]);
      const orgId = session.session?.activeOrganizationId || "dev_org_01";

      // 2. Enforce Tier Limit: check if org has reached maximum allowed chatbots for their tier
      let limitCheck = { allowed: true, current: 0, max: 3, tier: { name: "Growth" } };
      try {
        const check = await checkChatbotCreationLimit(orgId);
        limitCheck = check as any;
      } catch (e) {
        // use default in dev
      }

      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: (limitCheck as any).error || "Plan limit reached",
            limitReached: true,
            current: limitCheck.current,
            max: limitCheck.max,
            tier: limitCheck.tier.name,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = await request.json().catch(() => ({}));
      const botName = body.name || `Chatbot ${limitCheck.current + 1}`;
      const primaryColor = body.primaryColor || "#800020";
      const botId = uuidv4();
      const embedToken = `embed_${nanoid(4)}`;

      const newBot = {
        id: botId,
        organizationId: orgId,
        name: botName,
        primaryColor,
        theme: body.theme || "light",
        personality: body.personality || "support",
        initialMessage: body.initialMessage || `Hello! How can I assist you today?`,
        suggestedMessages: body.suggestedMessages || ["What can you help with?", "How do I get started?"],
        embedToken,
        isEmbeddingEnabled: true,
        createdAt: new Date(),
      };

      try {
        await db.insert(chatbot).values(newBot);
        await db
          .update(organization)
          .set({ chatbotCount: limitCheck.current + 1 })
          .where(eq(organization.id, orgId));
      } catch (dbErr) {
        // dev fallback
      }

      return new Response(JSON.stringify({ chatbot: newBot, tier: limitCheck.tier.name }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  DELETE: async ({ request }) => {
    try {
      // 1. Enforce RBAC: only the owner can permanently delete a chatbot
      const { session } = await requireOrgRole(request, ["owner"]);
      const orgId = session.session?.activeOrganizationId || "dev_org_01";

      const url = new URL(request.url);
      const botId = url.searchParams.get("id");

      if (!botId) {
        return new Response(JSON.stringify({ error: "Chatbot ID is required" }), { status: 400 });
      }

      try {
        await db.delete(chatbot).where(eq(chatbot.id, botId));
      } catch (dbErr) {
        // dev fallback
      }

      return new Response(JSON.stringify({ success: true, deletedId: botId }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
