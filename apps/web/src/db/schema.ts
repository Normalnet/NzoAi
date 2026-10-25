import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  json,
  primaryKey,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom vector type for pgvector
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);
  },
});

/* ==========================================================================
   IDENTITY & TENANCY (Better Auth)
   ========================================================================== */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  username: text("username"),
  externalId: text("external_id"),
  role: text("role").default("user").notNull(), // 'user' | 'superadmin'
  isSubscribed: boolean("is_subscribed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  activeChatbotId: text("active_chatbot_id"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  externalCustomerId: text("external_customer_id"),
  chatbotCount: integer("chatbot_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("member").notNull(), // 'owner' | 'admin' | 'member'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").default("member").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   CHATBOT & CONVERSATIONS
   ========================================================================== */

export const chatbot = pgTable("chatbot", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  image: text("image"),
  primaryColor: text("primary_color").default("#800020").notNull(),
  theme: text("theme").default("light").notNull(), // 'light' | 'dark'
  hidePoweredBy: boolean("hide_powered_by").default(false).notNull(),
  personality: text("personality").default("support").notNull(), // 'support' | 'sales' | 'lead' | 'custom'
  initialMessage: text("initial_message").default("Hello! How can I help you today?").notNull(),
  suggestedMessages: jsonb("suggested_messages").$type<string[]>().default([]).notNull(),
  trainingStatus: text("training_status").default("idle").notNull(), // 'idle' | 'in-progress' | 'completed' | 'failed'
  lastTrainedAt: timestamp("last_trained_at"),
  sourcesCount: integer("sources_count").default(0).notNull(),
  isEmbeddingEnabled: boolean("is_embedding_enabled").default(true).notNull(),
  embedToken: text("embed_token").notNull().unique(), // e.g. embed_xxxx
  allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chat = pgTable("Chat", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("userId"),
  chatbot_id: text("chatbot_id").references(() => chatbot.id, { onDelete: "cascade" }),
  visibility: text("visibility").default("private"),
  channel: text("channel").default("widget").notNull(), // 'web' | 'widget' | 'whatsapp' | 'telegram'
  status: text("status").default("unresolved").notNull(), // 'unresolved' | 'resolved' | 'escalated'
  agent_assigned: text("agent_assigned"),
  chat_meta_data: jsonb("chat_meta_data").$type<{
    country?: string;
    city?: string;
    timezone?: string;
    device?: string;
    platform?: string;
    ip?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const message = pgTable("Message", {
  id: text("id").primaryKey(),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'system' | 'assistant' | 'user' | 'human'
  parts: json("parts").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vote = pgTable(
  "vote",
  {
    chatId: text("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    messageId: text("messageId")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.messageId] }),
  ]
);

/* ==========================================================================
   TRAINING SOURCES & KNOWLEDGE BASE
   ========================================================================== */

export const documentSource = pgTable("document_source", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const textSource = pgTable("text_source", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const question = pgTable("question", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const websiteSource = pgTable("website_source", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  markdown: text("markdown").notNull(),
  metadata: jsonb("metadata"),
  type: text("type").default("scrape").notNull(), // 'scrape' | 'crawl'
  urlsCrawled: integer("urls_crawled").default(1),
  creditsUsed: integer("credits_used").default(0),
  crawlJobId: text("crawl_job_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledge = pgTable(
  "knowledge",
  {
    id: text("id").primaryKey(),
    chatbotId: text("chatbot_id")
      .notNull()
      .references(() => chatbot.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // 'website' | 'text' | 'document' | 'qna'
    sourceId: text("source_id").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    metadata: jsonb("metadata").$type<{
      chunkIndex?: number;
      documentName?: string;
      title?: string;
      url?: string;
      answer?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chatbot_idx").on(table.chatbotId),
    index("knowledge_chatbot_source_idx").on(table.chatbotId, table.source),
  ]
);

/* ==========================================================================
   AGENT ACTIONS & CAPTURED DATA
   ========================================================================== */

export const action = pgTable("action", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(), // 'collect_leads' | 'custom_button' | 'calendly_booking' | 'cal_booking'
  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  showInQuickMenu: boolean("show_in_quick_menu").default(false).notNull(),
  actionProperties: jsonb("action_properties").$type<Record<string, any>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lead = pgTable("lead", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message"),
  location: jsonb("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  email: text("email"),
  subject: text("subject"),
  message: text("message").notNull(),
  rating: integer("rating"),
  location: jsonb("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const issueReport = pgTable("issue_report", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  screenshot: text("screenshot"),
  email: text("email"),
  location: jsonb("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  image: text("image"),
  price: text("price"),
  featured: boolean("featured").default(false).notNull(),
  type: text("type").default("downloadable").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visitorAnalytics = pgTable("visitor_analytics", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  event: text("event").notNull(), // 'page_view' | 'chat_open' | 'message_sent' | etc.
  durationMs: integer("duration_ms").default(0),
  device: text("device"),
  platform: text("platform"),
  city: text("city"),
  region: text("region"),
  country: text("country"),
  continent: text("continent"),
  ip: text("ip"),
  referer: text("referer"),
  extra: jsonb("extra"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendlyIntegration = pgTable("calendly_integration", {
  id: text("id").primaryKey(),
  chatbotId: text("chatbot_id")
    .notNull()
    .references(() => chatbot.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  organizationUri: text("organization_uri"),
  userUri: text("user_uri"),
  eventTypes: jsonb("event_types"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ==========================================================================
   BILLING & USAGE (Polar)
   ========================================================================== */

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  referenceId: text("reference_id"), // Organization ID
  status: text("status").notNull(), // 'active' | 'trialing' | 'canceled' | etc.
  amount: integer("amount"),
  currency: text("currency").default("usd"),
  recurringInterval: text("recurring_interval"), // 'month' | 'year'
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  customerId: text("customer_id"),
  productId: text("product_id"),
  checkoutId: text("checkout_id"),
  meters: jsonb("meters"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creditsUsage = pgTable("credits_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  creditCount: integer("credit_count").default(0).notNull(),
  date: text("date").notNull(),
  resetAt: timestamp("reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
