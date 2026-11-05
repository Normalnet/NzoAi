import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { organization } from "better-auth/plugins";
import { db } from "./src/db";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "a_very_secret_key_minimum_32_characters_long_12345",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001"),
  trustedOrigins: [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://localhost:*",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:*",
    "https://nzoai.vercel.app",
    "https://*.vercel.app",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  advanced: {
    trustedProxyHeaders: true,
  },
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
    } as any),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session: any) => {
          try {
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
          } catch (err) {
            console.warn("[auth] Non-fatal error resolving initial session organization:", err);
          }

          return { data: session };
        },
      },
    },
  },
});
