import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { invitation, member, organization, chatbot, session } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/accept-invitation").methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const inviteId = url.searchParams.get("id");

      if (!inviteId) {
        return new Response(JSON.stringify({ error: "id parameter required" }), { status: 400 });
      }

      const inv = await db.query.invitation.findFirst({
        where: eq(invitation.id, inviteId),
      });

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), { status: 404 });
      }

      if (inv.status !== "pending") {
        return new Response(JSON.stringify({ error: `Invitation has already been ${inv.status}` }), { status: 400 });
      }

      if (new Date(inv.expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: "Invitation has expired" }), { status: 410 });
      }

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, inv.organizationId),
      });

      return new Response(
        JSON.stringify({
          invitation: {
            id: inv.id,
            email: inv.email,
            role: inv.role,
            organizationName: org?.name || "Workspace",
            expiresAt: inv.expiresAt,
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const userId = authSession.user.id;
      const { inviteId } = await request.json();

      if (!inviteId) {
        return new Response(JSON.stringify({ error: "inviteId is required" }), { status: 400 });
      }

      const inv = await db.query.invitation.findFirst({
        where: eq(invitation.id, inviteId),
      });

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), { status: 404 });
      }

      if (inv.status !== "pending") {
        return new Response(JSON.stringify({ error: `Invitation has already been ${inv.status}` }), { status: 400 });
      }

      if (new Date(inv.expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: "Invitation has expired" }), { status: 410 });
      }

      // Check if user is already a member
      const existingMember = await db.query.member.findFirst({
        where: and(eq(member.organizationId, inv.organizationId), eq(member.userId, userId)),
      });

      if (!existingMember) {
        await db.insert(member).values({
          id: uuidv4(),
          organizationId: inv.organizationId,
          userId,
          role: inv.role || "member",
        });
      }

      // Mark invitation accepted
      await db
        .update(invitation)
        .set({ status: "accepted" })
        .where(eq(invitation.id, inviteId));

      // Resolve primary chatbot for this organization
      const primaryBot = await db.query.chatbot.findFirst({
        where: eq(chatbot.organizationId, inv.organizationId),
      });

      // Update session active organization
      if (authSession.session?.id) {
        try {
          await db
            .update(session)
            .set({
              activeOrganizationId: inv.organizationId,
              activeChatbotId: primaryBot?.id || null,
              updatedAt: new Date(),
            })
            .where(eq(session.id, authSession.session.id));
        } catch (sessErr) {
          console.warn("[accept-invitation] Session update notice:", sessErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          organizationId: inv.organizationId,
          chatbotId: primaryBot?.id,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("[accept-invitation error]:", err);
      return new Response(JSON.stringify({ error: err.message || "Failed to accept invitation" }), {
        status: err.statusCode || 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
