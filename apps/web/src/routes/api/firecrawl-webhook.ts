import { createServerFileRoute } from "@/lib/server-route";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { websiteSource } from "../../db/schema";

export const ServerRoute = createServerFileRoute("/api/firecrawl-webhook").methods({
  POST: async ({ request }) => {
    try {
      const reqUrl = new URL(request.url);
      const queryChatbotId = reqUrl.searchParams.get("chatbotId");

      const body = await request.json();
      const eventType = body.type || body.event;
      const jobId = body.id || body.jobId || "unknown";
      const targetChatbotId = queryChatbotId || body.chatbotId || body.metadata?.chatbotId;

      if (!targetChatbotId) {
        console.warn("[firecrawl-webhook] Received event without chatbotId:", eventType, jobId);
        return new Response(JSON.stringify({ error: "Missing chatbotId parameter" }), { status: 400 });
      }

      console.log(`[firecrawl-webhook] Event: ${eventType}, Job: ${jobId}, Chatbot: ${targetChatbotId}`);

      // Handle page crawled event
      if (eventType === "crawl.page" || eventType === "page") {
        const pages = Array.isArray(body.data) ? body.data : [body.data];

        for (const page of pages) {
          if (!page) continue;
          const pageUrl = page.metadata?.sourceURL || page.metadata?.url || page.url;
          const markdown = page.markdown || "";

          if (pageUrl && markdown) {
            await db.insert(websiteSource).values({
              id: uuidv4(),
              chatbotId: targetChatbotId,
              url: pageUrl,
              markdown,
              metadata: page.metadata || { title: pageUrl },
              type: "crawl",
              urlsCrawled: 1,
              crawlJobId: jobId,
            });
          }
        }
      } else if (eventType === "crawl.completed" || eventType === "completed") {
        // If the completed payload includes all accumulated pages
        if (Array.isArray(body.data)) {
          for (const page of body.data) {
            if (!page) continue;
            const pageUrl = page.metadata?.sourceURL || page.metadata?.url || page.url;
            const markdown = page.markdown || "";

            if (pageUrl && markdown) {
              await db.insert(websiteSource).values({
                id: uuidv4(),
                chatbotId: targetChatbotId,
                url: pageUrl,
                markdown,
                metadata: page.metadata || { title: pageUrl },
                type: "crawl",
                urlsCrawled: 1,
                crawlJobId: jobId,
              });
            }
          }
        }
        console.log(`[firecrawl-webhook] Crawl job ${jobId} completed successfully.`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[firecrawl-webhook] Error processing webhook:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
});
