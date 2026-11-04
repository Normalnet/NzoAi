import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import { db } from "../../../db";
import { organization, member, chatbot, session, invitation } from "../../../db/schema";
import { requireAuthSession } from "../../../middlewares/auth";
import { Resend } from "resend";

export const ServerRoute = createServerFileRoute("/api/onboarding/complete").methods({
  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const userId = authSession.user.id;
      const body = await request.json();
      const {
        orgName,
        botName,
        primaryColor = "#800020",
        personality = "support",
        teammateEmail,
      } = body;

      if (!orgName || typeof orgName !== "string" || !orgName.trim()) {
        return new Response(JSON.stringify({ error: "Organization name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const cleanOrgName = orgName.trim();
      let orgId: string;
      let botId: string;

      // 1. Check if user already belongs to an organization
      const existingMembership = await db.query.member.findFirst({
        where: eq(member.userId, userId),
      });

      if (existingMembership) {
        orgId = existingMembership.organizationId;
        const existingBot = await db.query.chatbot.findFirst({
          where: eq(chatbot.organizationId, orgId),
        });

        if (existingBot) {
          botId = existingBot.id;
          await db
            .update(chatbot)
            .set({
              name: botName ? botName.trim() : existingBot.name,
              primaryColor,
              personality,
              updatedAt: new Date(),
            })
            .where(eq(chatbot.id, botId));
        } else {
          botId = uuidv4();
          await db.insert(chatbot).values({
            id: botId,
            organizationId: orgId,
            name: botName ? botName.trim() : `${cleanOrgName} Assistant`,
            primaryColor,
            theme: "light",
            personality,
            initialMessage: `Hello! How can I help you with ${cleanOrgName} today?`,
            suggestedMessages: ["What services do you offer?", "How do I get started?"],
            embedToken: `embed_${nanoid(6)}`,
            isEmbeddingEnabled: true,
          });
        }
      } else {
        // 2. Create new organization
        orgId = uuidv4();
        const slug =
          cleanOrgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") + `-${nanoid(4)}`;

        await db.insert(organization).values({
          id: orgId,
          name: cleanOrgName,
          slug,
          chatbotCount: 1,
        });

        // 3. Add user as owner
        await db.insert(member).values({
          id: uuidv4(),
          organizationId: orgId,
          userId,
          role: "owner",
        });

        // 4. Create initial chatbot
        botId = uuidv4();
        await db.insert(chatbot).values({
          id: botId,
          organizationId: orgId,
          name: botName ? botName.trim() : `${cleanOrgName} Assistant`,
          primaryColor,
          theme: "light",
          personality,
          initialMessage: `Hello! How can I help you with ${cleanOrgName} today?`,
          suggestedMessages: ["What services do you offer?", "How do I get started?"],
          embedToken: `embed_${nanoid(6)}`,
          isEmbeddingEnabled: true,
        });
      }

      // 5. Update session with active organization and active chatbot
      if (authSession.session?.id) {
        try {
          await db
            .update(session)
            .set({
              activeOrganizationId: orgId,
              activeChatbotId: botId,
              updatedAt: new Date(),
            })
            .where(eq(session.id, authSession.session.id));
        } catch (sessErr) {
          console.warn("[onboarding] Session update notice:", sessErr);
        }
      }

      // 6. Handle optional teammate invitation
      if (teammateEmail && typeof teammateEmail === "string" && teammateEmail.includes("@")) {
        try {
          const inviteId = uuidv4();
          const cleanEmail = teammateEmail.toLowerCase().trim();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await db.insert(invitation).values({
            id: inviteId,
            organizationId: orgId,
            email: cleanEmail,
            role: "member",
            status: "pending",
            expiresAt,
            inviterId: userId,
          });

          if (process.env.RESEND_API_KEY) {
            try {
              const resend = new Resend(process.env.RESEND_API_KEY);
              const inviteUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3001"}/invite/${inviteId}`;
              await resend.emails.send({
                from: "invites@nzoai.com",
                to: cleanEmail,
                subject: `You've been invited to join ${cleanOrgName} on NzoAI`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #800020;">Team Invitation</h2>
                    <p>You have been invited to join <strong>${cleanOrgName}</strong> as a support agent on NzoAI.</p>
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
              console.warn("[onboarding] Failed to send email via Resend:", emailErr);
            }
          }
        } catch (invErr) {
          console.warn("[onboarding] Failed to record invitation:", invErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          organizationId: orgId,
          chatbotId: botId,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("[onboarding error]:", err);
      return new Response(JSON.stringify({ error: err.message || "Failed to finalize onboarding" }), {
        status: err.statusCode || 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
