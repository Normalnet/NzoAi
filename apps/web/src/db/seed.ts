import "dotenv/config";
import { db } from "./index";
import { user, organization, member, chatbot, question, textSource, action, account, subscription } from "./schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "better-auth/crypto";

async function seed() {
  console.log("[seed] Seeding database for development and testing...");

  const founderId = "dev_user_founder";
  const orgId = "dev_org_01";
  const botId = "dev_bot_01";
  const founderEmail = "founder@nzoai.com";
  const defaultPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || "admin123456";

  // 1. Seed Founder User
  let existingUser = await db.query.user.findFirst({
    where: eq(user.email, founderEmail),
  });

  if (!existingUser) {
    const [created] = await db.insert(user).values({
      id: founderId,
      name: "Platform Founder",
      email: founderEmail,
      emailVerified: true,
      role: "superadmin",
      isSubscribed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    existingUser = created;
    console.log(`[seed] Created founder user: ${founderEmail}`);
  } else {
    // Ensure founder user has superadmin role and verified email
    await db
      .update(user)
      .set({ role: "superadmin", emailVerified: true, isSubscribed: true, updatedAt: new Date() })
      .where(eq(user.id, existingUser.id));
    console.log(`[seed] Founder user verified with superadmin role: ${founderEmail}`);
  }

  const targetUserId = existingUser ? existingUser.id : founderId;

  // 1b. Seed Credentials Account for Superadmin (Better Auth Password)
  const hashedPassword = await hashPassword(defaultPassword);
  const existingAccount = await db.query.account.findFirst({
    where: and(
      eq(account.userId, targetUserId),
      eq(account.providerId, "credential")
    ),
  });

  if (!existingAccount) {
    await db.insert(account).values({
      id: uuidv4(),
      accountId: targetUserId,
      providerId: "credential",
      userId: targetUserId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[seed] Created credentials account with password for ${founderEmail}`);
  } else {
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(account.id, existingAccount.id));
    console.log(`[seed] Updated credentials password for ${founderEmail}`);
  }

  // 1c. Seed Tenant User (normalnet001@gmail.com)
  const tenantEmail = "normalnet001@gmail.com";
  const tenantPasswordHash = await hashPassword("smart123456");
  let existingTenantUser = await db.query.user.findFirst({
    where: eq(user.email, tenantEmail),
  });

  if (existingTenantUser) {
    const existingTenantAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, existingTenantUser.id),
        eq(account.providerId, "credential")
      ),
    });

    if (existingTenantAccount) {
      await db
        .update(account)
        .set({
          password: tenantPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingTenantAccount.id));
      console.log(`[seed] Updated tenant password to smart123456 for ${tenantEmail}`);
    } else {
      await db.insert(account).values({
        id: uuidv4(),
        accountId: existingTenantUser.id,
        providerId: "credential",
        userId: existingTenantUser.id,
        password: tenantPasswordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[seed] Created credentials account for tenant: ${tenantEmail}`);
    }
  }

  // 2. Seed Organization
  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (!existingOrg) {
    await db.insert(organization).values({
      id: orgId,
      name: "Acme Corporation",
      slug: "acme-corp",
      chatbotCount: 1,
      createdAt: new Date(),
    });
    console.log(`[seed] Created test organization: Acme Corporation (${orgId})`);
  }

  // 3. Seed Membership
  const existingMember = await db.query.member.findFirst({
    where: eq(member.userId, targetUserId),
  });

  if (!existingMember) {
    await db.insert(member).values({
      id: "dev_mem_01",
      organizationId: orgId,
      userId: targetUserId,
      role: "owner",
      createdAt: new Date(),
    });
    console.log("[seed] Created workspace owner membership");
  }

  // 3b. Seed Master Platform Subscription for Founder Workspace
  const existingSub = await db.query.subscription.findFirst({
    where: eq(subscription.referenceId, orgId),
  });

  if (!existingSub) {
    await db.insert(subscription).values({
      id: "sub_master_01",
      userId: targetUserId,
      referenceId: orgId,
      status: "active",
      productId: "master",
      amount: 0,
      currency: "usd",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[seed] Created platform master subscription (exempt from billing)");
  } else if (existingSub.productId !== "master") {
    await db
      .update(subscription)
      .set({ productId: "master", status: "active", updatedAt: new Date() })
      .where(eq(subscription.id, existingSub.id));
    console.log("[seed] Upgraded existing workspace to master platform subscription");
  }

  // 4. Seed Chatbot
  const existingBot = await db.query.chatbot.findFirst({
    where: eq(chatbot.id, botId),
  });

  if (!existingBot) {
    await db.insert(chatbot).values({
      id: botId,
      organizationId: orgId,
      name: "Acme Support Bot",
      primaryColor: "#800020",
      theme: "light",
      personality: "support",
      initialMessage: "Hello! Welcome to Acme Support. How can we help you today?",
      suggestedMessages: [
        "What services does Acme provide?",
        "How do I request a demo?",
        "Can I speak with a human agent?",
      ],
      trainingStatus: "idle",
      embedToken: "embed_demo",
      isEmbeddingEnabled: true,
      allowedDomains: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[seed] Created primary chatbot: Acme Support Bot (${botId})`);
  }

  // 5. Seed Starter Knowledge
  const existingQ = await db.query.question.findFirst({
    where: eq(question.chatbotId, botId),
  });

  if (!existingQ) {
    await db.insert(question).values([
      {
        id: uuidv4(),
        chatbotId: botId,
        question: "What is Acme Corporation?",
        answer: "Acme Corporation is a leading technology solutions provider specializing in autonomous AI customer support.",
      },
      {
        id: uuidv4(),
        chatbotId: botId,
        question: "What are your business operating hours?",
        answer: "Our support operations are active Monday to Friday from 8:00 AM to 6:00 PM GMT.",
      },
    ]);

    await db.insert(textSource).values({
      id: uuidv4(),
      chatbotId: botId,
      title: "Company Return & Refund Policy",
      content: "All Acme subscriptions and purchases come with a 30-day money-back guarantee. If you are not completely satisfied, contact support for a full refund.",
    });

    console.log("[seed] Created sample knowledge FAQs and text source");
  }

  // 6. Seed Sample Actions
  const existingAction = await db.query.action.findFirst({
    where: eq(action.chatbotId, botId),
  });

  if (!existingAction) {
    await db.insert(action).values({
      id: uuidv4(),
      chatbotId: botId,
      toolName: "collect_leads",
      name: "Request Sales Contact",
      description: "Triggered when a visitor asks for pricing, quotes, or sales outreach",
      isActive: true,
      showInQuickMenu: true,
      actionProperties: {},
    });
    console.log("[seed] Created sample lead capture action");
  }

  console.log("\n========================================================");
  console.log("🔑 SUPERADMIN LOGIN CREDENTIALS READY");
  console.log(`   URL:      http://localhost:3001/login`);
  console.log(`   Email:    ${founderEmail}`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     superadmin`);
  console.log("========================================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed error]:", err);
  process.exit(1);
});
