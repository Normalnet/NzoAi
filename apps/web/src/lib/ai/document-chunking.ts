import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromDocument(fileBuffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (mimeType.includes("pdf") || ext === "pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("docx") ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  if (mimeType.includes("text/plain") || ext === "txt" || ext === "md") {
    return fileBuffer.toString("utf-8");
  }

  if (ext === "doc") {
    throw new Error("Legacy .doc format is not supported. Please convert to .docx or .pdf.");
  }

  // Fallback as UTF-8 text
  return fileBuffer.toString("utf-8");
}

export function chunkDocument(text: string, maxChunkLength: number = 500, overlapWordCount: number = 20): string[] {
  const sanitized = text.replace(/\0/g, "").replace(/\r\n/g, "\n");
  
  // Split on sentence boundaries: punctuation followed by space or newline
  const rawSentences = sanitized.split(/(?<=[.?!])\s+/);
  const sentences = rawSentences
    .map((s) => s.trim())
    .filter((s) => s.length > 10); // Sentences of 10 characters or fewer are dropped

  const chunks: string[] = [];
  let currentChunk = "";
  let overlapWords: string[] = [];

  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Calculate overlap: up to 20 words from the end of current chunk
      const words = currentChunk.split(/\s+/);
      overlapWords = words.slice(-overlapWordCount);
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
