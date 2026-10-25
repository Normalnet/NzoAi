import { embed, embedMany } from "ai";
import { EMBEDDING_MODEL } from "./providers";

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\0/g, "").trim();
  if (!cleanText) {
    return new Array(768).fill(0);
  }

  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: cleanText,
  });

  return embedding;
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanTexts = texts.map((t) => t.replace(/\0/g, "").trim()).filter(Boolean);
  if (cleanTexts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: cleanTexts,
  });

  return embeddings;
}
