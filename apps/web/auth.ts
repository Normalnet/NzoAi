import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./src/db";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || "default_super_secret_key_32_characters_minimum_12345",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },
  plugins: [
    organization({
      async onOrganizationCreated({ organization }: any) {
        // Automatically create a default chatbot for the organization
        const defaultBotId = uuidv4();
        const embedToken = `embed_${nanoid(4)}`;

        await db.insert(schema.chatbot).values({
          id: defaultBotId,
          organizationId: organization.id,
          name: organization.name,
          primaryColor: "#800020",
          theme: "light",
          personality: "support",
          initialMessage: `Hi! How can I help you with ${organization.name} today?`,
          suggestedMessages: ["What services do you offer?", "How do I get in touch?"],
          embedToken,
          isEmbeddingEnabled: true,
        });

        await db
          .update(schema.organization)
          .set({ chatbotCount: 1 })
          .where(eq(schema.organization.id, organization.id));
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session: any) => {
          // Populate activeOrganizationId and activeChatbotId
          const firstMembership = await db.query.member.findFirst({
            where: eq(schema.member.userId, session.userId),
          });

          if (firstMembership) {
            session.activeOrganizationId = firstMembership.organizationId;
            const firstBot = await db.query.chatbot.findFirst({
              where: eq(schema.chatbot.organizationId, firstMembership.organizationId),
            });
            if (firstBot) {
              session.activeChatbotId = firstBot.id;
            }
          }

          return { data: session };
        },
      },
    },
  },
});
