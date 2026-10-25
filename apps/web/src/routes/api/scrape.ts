import { createServerFileRoute } from "@/lib/server-route";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { websiteSource, knowledge } from "../../db/schema";
import { requireAuthSession } from "../../middlewares/auth";

export const ServerRoute = createServerFileRoute("/api/scrape").methods({
  GET: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ websiteSources: [] }), { headers: { "Content-Type": "application/json" } });
      }

      const sources = await db.query.websiteSource.findMany({
        where: eq(websiteSource.chatbotId, activeBotId),
        orderBy: [websiteSource.createdAt],
      });

      return new Response(JSON.stringify({ websiteSources: sources }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;

      if (!activeBotId) {
        return new Response(JSON.stringify({ error: "No active chatbot selected" }), { status: 400 });
      }

      const { url } = await request.json();
      if (!url) {
        return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
      }

      let markdown = "";
      let metadata: any = { url, title: url };

      // Use Firecrawl if configured
      if (process.env.FIRECRAWL_API_KEY) {
        try {
          const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            },
            body: JSON.stringify({ url, formats: ["markdown"] }),
          });

          if (fcRes.ok) {
            const data = await fcRes.json();
            markdown = data?.data?.markdown || "";
            metadata = data?.data?.metadata || metadata;
          }
        } catch (fcErr) {
          console.warn("[scrape] Firecrawl API fallback:", fcErr);
        }
      }

      // Fallback simple fetch
      if (!markdown) {
        try {
          const fetchRes = await fetch(url, { headers: { "User-Agent": "NzoAI-Bot/1.0" } });
          const html = await fetchRes.text();
          // Extract text and strip basic HTML tags
          markdown = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        } catch (fetchErr: any) {
          return new Response(JSON.stringify({ error: `Failed to fetch URL: ${fetchErr.message}` }), { status: 400 });
        }
      }

      const [created] = await db
        .insert(websiteSource)
        .values({
          id: uuidv4(),
          chatbotId: activeBotId,
          url,
          markdown,
          metadata,
          type: "scrape",
          urlsCrawled: 1,
        })
        .returning();

      return new Response(JSON.stringify({ success: true, websiteSource: created }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  DELETE: async ({ request }) => {
    try {
      const authSession = await requireAuthSession(request);
      const activeBotId = authSession.session.activeChatbotId;
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id || !activeBotId) {
        return new Response(JSON.stringify({ error: "id parameter required" }), { status: 400 });
      }

      await db
        .delete(websiteSource)
        .where(and(eq(websiteSource.id, id), eq(websiteSource.chatbotId, activeBotId)));

      await db
        .delete(knowledge)
        .where(and(eq(knowledge.sourceId, id), eq(knowledge.chatbotId, activeBotId)));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
