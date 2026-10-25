import { sql, eq } from "drizzle-orm";
import { db } from "../../db";
import { knowledge } from "../../db/schema";
import { generateEmbedding } from "./embeddings";

export interface KnowledgeResult {
  id: string;
  source: string;
  content: string;
  relevance: number;
  metadata?: any;
  answer?: string;
  sourceUrl?: string;
}

export async function searchKnowledge(
  query: string,
  chatbotId: string,
  limit: number = 10,
  threshold: number = 0.2
): Promise<KnowledgeResult[]> {
  // Check if chatbot has any knowledge rows
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(knowledge)
    .where(eq(knowledge.chatbotId, chatbotId));

  const total = Number(countRes[0]?.count ?? 0);
  if (total === 0) {
    return [];
  }

  // Generate 768-dim embedding for query
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Cosine distance <=>
  // similarity = 1 - distance
  const results = await db
    .select({
      id: knowledge.id,
      source: knowledge.source,
      content: knowledge.content,
      metadata: knowledge.metadata,
      distance: sql<number>`${knowledge.embedding} <=> ${vectorStr}::vector`,
    })
    .from(knowledge)
    .where(eq(knowledge.chatbotId, chatbotId))
    .orderBy(sql`${knowledge.embedding} <=> ${vectorStr}::vector`)
    .limit(limit);

  const formatted: KnowledgeResult[] = [];
  for (const r of results) {
    const similarity = 1 - (r.distance ?? 1);
    if (similarity >= threshold) {
      formatted.push({
        id: r.id,
        source: r.source,
        content: r.content,
        relevance: Math.round(similarity * 100) / 100,
        metadata: r.metadata,
        answer: r.metadata?.answer,
        sourceUrl: r.metadata?.url,
      });
    }
  }

  return formatted;
}
