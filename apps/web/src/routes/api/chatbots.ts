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
      const orgId = authSession.session.activeOrganizationId;

      if (!orgId) {
        return new Response(JSON.stringify({ chatbots: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const bots = await db.query.chatbot.findMany({
        where: eq(chatbot.organizationId, orgId),
        orderBy: [chatbot.createdAt],
      });

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
      const orgId = session.session.activeOrganizationId;

      // 2. Enforce Tier Limit: check if org has reached maximum allowed chatbots for their tier
      const limitCheck = await checkChatbotCreationLimit(orgId);
      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: limitCheck.error,
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

      const [newBot] = await db
        .insert(chatbot)
        .values({
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
        })
        .returning();

      // Update organization bot count
      await db
        .update(organization)
        .set({ chatbotCount: limitCheck.current + 1 })
        .where(eq(organization.id, orgId));

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
      const orgId = session.session.activeOrganizationId;

      const url = new URL(request.url);
      const botId = url.searchParams.get("id");

      if (!botId) {
        return new Response(JSON.stringify({ error: "Chatbot ID is required" }), { status: 400 });
      }

      const bot = await db.query.chatbot.findFirst({
        where: and(eq(chatbot.id, botId), eq(chatbot.organizationId, orgId)),
      });

      if (!bot) {
        return new Response(JSON.stringify({ error: "Chatbot not found or unauthorized" }), { status: 404 });
      }

      await db.delete(chatbot).where(eq(chatbot.id, botId));

      return new Response(JSON.stringify({ success: true, deletedId: botId }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
