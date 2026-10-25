-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- User
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "username" text,
  "external_id" text,
  "is_subscribed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Organization
CREATE TABLE IF NOT EXISTS "organization" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text UNIQUE,
  "logo" text,
  "metadata" text,
  "external_customer_id" text,
  "chatbot_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Member
CREATE TABLE IF NOT EXISTS "member" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Invitation
CREATE TABLE IF NOT EXISTS "invitation" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text DEFAULT 'member' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Session
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "active_organization_id" text,
  "active_chatbot_id" text
);

-- Account
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Verification
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Chatbot
CREATE TABLE IF NOT EXISTS "chatbot" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "image" text,
  "primary_color" text DEFAULT '#800020' NOT NULL,
  "theme" text DEFAULT 'light' NOT NULL,
  "hide_powered_by" boolean DEFAULT false NOT NULL,
  "personality" text DEFAULT 'support' NOT NULL,
  "initial_message" text DEFAULT 'Hello! How can I help you today?' NOT NULL,
  "suggested_messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "training_status" text DEFAULT 'idle' NOT NULL,
  "last_trained_at" timestamp,
  "sources_count" integer DEFAULT 0 NOT NULL,
  "is_embedding_enabled" boolean DEFAULT true NOT NULL,
  "embed_token" text NOT NULL UNIQUE,
  "allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Chat
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text,
  "userId" text,
  "chatbot_id" text REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "visibility" text DEFAULT 'private',
  "channel" text DEFAULT 'widget' NOT NULL,
  "status" text DEFAULT 'unresolved' NOT NULL,
  "agent_assigned" text,
  "chat_meta_data" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Message
CREATE TABLE IF NOT EXISTS "Message" (
  "id" text PRIMARY KEY NOT NULL,
  "chatId" text NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "parts" json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Vote
CREATE TABLE IF NOT EXISTS "vote" (
  "chatId" text NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "messageId" text NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
  "isUpvoted" boolean NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

-- Document Source
CREATE TABLE IF NOT EXISTS "document_source" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "size" integer NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Text Source
CREATE TABLE IF NOT EXISTS "text_source" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Question (Q&A)
CREATE TABLE IF NOT EXISTS "question" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Website Source
CREATE TABLE IF NOT EXISTS "website_source" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "markdown" text NOT NULL,
  "metadata" jsonb,
  "type" text DEFAULT 'scrape' NOT NULL,
  "urls_crawled" integer DEFAULT 1,
  "credits_used" integer DEFAULT 0,
  "crawl_job_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Knowledge Base (pgvector 768-dim)
CREATE TABLE IF NOT EXISTS "knowledge" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "source_id" text NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(768),
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "knowledge_chatbot_idx" ON "knowledge" ("chatbot_id");
CREATE INDEX IF NOT EXISTS "knowledge_chatbot_source_idx" ON "knowledge" ("chatbot_id", "source");
CREATE INDEX IF NOT EXISTS "knowledge_embedding_hnsw_idx" ON "knowledge" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Action
CREATE TABLE IF NOT EXISTS "action" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "tool_name" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "show_in_quick_menu" boolean DEFAULT false NOT NULL,
  "action_properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Lead
CREATE TABLE IF NOT EXISTS "lead" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "contact" text NOT NULL,
  "message" text,
  "location" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Feedback
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "email" text,
  "subject" text,
  "message" text NOT NULL,
  "rating" integer,
  "location" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Issue Report
CREATE TABLE IF NOT EXISTS "issue_report" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "screenshot" text,
  "email" text,
  "location" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Product
CREATE TABLE IF NOT EXISTS "product" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "image" text,
  "price" text,
  "featured" boolean DEFAULT false NOT NULL,
  "type" text DEFAULT 'downloadable' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Visitor Analytics
CREATE TABLE IF NOT EXISTS "visitor_analytics" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "visitor_id" text NOT NULL,
  "event" text NOT NULL,
  "duration_ms" integer DEFAULT 0,
  "device" text,
  "platform" text,
  "city" text,
  "region" text,
  "country" text,
  "continent" text,
  "ip" text,
  "referer" text,
  "extra" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Calendly Integration
CREATE TABLE IF NOT EXISTS "calendly_integration" (
  "id" text PRIMARY KEY NOT NULL,
  "chatbot_id" text NOT NULL REFERENCES "chatbot"("id") ON DELETE CASCADE,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "organization_uri" text,
  "user_uri" text,
  "event_types" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Subscription
CREATE TABLE IF NOT EXISTS "subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "reference_id" text,
  "status" text NOT NULL,
  "amount" integer,
  "currency" text DEFAULT 'usd',
  "recurring_interval" text,
  "period_start" timestamp,
  "period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "customer_id" text,
  "product_id" text,
  "checkout_id" text,
  "meters" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Credits Usage
CREATE TABLE IF NOT EXISTS "credits_usage" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "credit_count" integer DEFAULT 0 NOT NULL,
  "date" text NOT NULL,
  "reset_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
