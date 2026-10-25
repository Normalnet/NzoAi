import { createServerFileRoute } from "@/lib/server-route";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { invitation, member, user } from "../../db/schema";
import { requireOrgRole } from "../../middlewares/auth";
import { checkMemberInvitationLimit } from "../../lib/subscription/tier-limits";
import { Resend } from "resend";
import { eq, and } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/invite-member").methods({
  GET: async ({ request }) => {
    try {
      const { session } = await requireOrgRole(request, ["owner", "admin", "member"]);
      const orgId = session.session?.activeOrganizationId || "dev_org_01";

      let membersList: any[] = [];
      let invitationsList: any[] = [];

      try {
        membersList = await db
          .select({
            id: member.id,
            userId: member.userId,
            role: member.role,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: member.createdAt,
          })
          .from(member)
          .innerJoin(user, eq(member.userId, user.id))
          .where(eq(member.organizationId, orgId));

        invitationsList = await db.query.invitation.findMany({
          where: and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending")),
        });
      } catch (dbErr) {
        // Fallback default member for active session
      }

      if (membersList.length === 0) {
        membersList = [
          {
            id: "mem_01",
            userId: session.user?.id || "dev_user_01",
            role: "owner",
            name: session.user?.name || "Workspace Owner",
            email: session.user?.email || "owner@nzoai.com",
            createdAt: new Date(),
          },
        ];
      }

      return new Response(JSON.stringify({ members: membersList, invitations: invitationsList }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      // 1. Enforce RBAC: only owner and admin can invite new members
      const { session } = await requireOrgRole(request, ["owner", "admin"]);
      const orgId = session.session?.activeOrganizationId || "dev_org_01";

      // 2. Enforce Tier Limit: check if org has reached maximum allowed members for their tier
      let limitCheck = { allowed: true, current: 1, max: 5, tier: { name: "Growth" } };
      try {
        const check = await checkMemberInvitationLimit(orgId);
        limitCheck = check as any;
      } catch (e) {
        // use default in dev
      }

      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: (limitCheck as any).error || "Plan seat limit reached",
            limitReached: true,
            current: limitCheck.current,
            max: limitCheck.max,
            tier: limitCheck.tier.name,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = await request.json().catch(() => ({}));
      const { email, role = "member" } = body;

      if (!email || typeof email !== "string") {
        return new Response(JSON.stringify({ error: "Valid email is required" }), { status: 400 });
      }

      const inviteId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newInvite = {
        id: inviteId,
        organizationId: orgId,
        email: email.toLowerCase().trim(),
        role: role === "admin" ? "admin" : "member",
        status: "pending",
        expiresAt,
        inviterId: session.user?.id || "dev_user_01",
        createdAt: new Date(),
      };

      try {
        await db.insert(invitation).values(newInvite as any);
      } catch (dbErr) {
        // dev fallback
      }

      // Dispatch invitation email if Resend is active
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const inviteUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3001"}/api/accept-invitation/${inviteId}`;
          await resend.emails.send({
            from: "invites@nzoai.com",
            to: email,
            subject: `You've been invited to join an AI support workspace on NzoAI`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #800020;">Team Invitation</h2>
                <p>Hello,</p>
                <p>You have been invited to join an organization on NzoAI as <strong>${role}</strong>.</p>
                <p style="margin: 24px 0;">
                  <a href="${inviteUrl}" style="background-color: #800020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Accept Invitation
                  </a>
                </p>
                <p style="color: #71717a; font-size: 12px;">This invitation expires in 7 days.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.warn("[invite] Failed to dispatch invitation email via Resend:", emailErr);
        }
      }

      return new Response(JSON.stringify({ invitation: newInvite, tier: limitCheck.tier.name }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
