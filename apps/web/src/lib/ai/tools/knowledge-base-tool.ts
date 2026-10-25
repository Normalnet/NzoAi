import { tool } from "ai";
import { z } from "zod";
import { searchKnowledge } from "../search";

export function createKnowledgeBaseTool(chatbotId: string) {
  return tool({
    description: "Search the organization's knowledge base for relevant documents, FAQs, and product details.",
    parameters: z.object({
      query: z.string().describe("The search query to look up in the knowledge base"),
    }),
    execute: async ({ query }) => {
      const results = await searchKnowledge(query, chatbotId, 5, 0.2);
      return {
        query,
        count: results.length,
        results: results.map((r) => ({
          relevance: r.relevance,
          content: r.content,
          source: r.source,
          answer: r.answer,
          sourceUrl: r.sourceUrl,
        })),
      };
    },
  });
}
