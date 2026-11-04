import { createServerFileRoute } from "@/lib/server-route";
import { v4 as uuidv4 } from "uuid";
import { requireAuthSession } from "../../middlewares/auth";
import { extractTextFromDocument } from "../../lib/ai/document-chunking";
import { getStorageClient, uploadToStorage } from "@/lib/storage";

export const ServerRoute = createServerFileRoute("/api/upload-documents").methods({
  POST: async ({ request }) => {
    try {
      await requireAuthSession(request);

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
      }

      // Max 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File exceeds 20MB limit" }), { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "application/octet-stream";

      // Direct in-memory extraction (Option 2: Direct PostgreSQL Ingestion)
      let extractedContent = "";
      try {
        extractedContent = await extractTextFromDocument(buffer, mime, file.name);
        // Sanitize string (strip null characters for Postgres text storage)
        extractedContent = extractedContent.replace(/\0/g, "").trim();
      } catch (extractErr: any) {
        return new Response(
          JSON.stringify({
            error: `Failed to extract text from document: ${extractErr.message || extractErr}`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!extractedContent) {
        return new Response(
          JSON.stringify({
            error: "The uploaded document contains no readable text or is empty.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let storageUrl = "";
      const storageClient = getStorageClient();
      if (storageClient) {
        try {
          const key = `documents/${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          storageUrl = await uploadToStorage(key, buffer, mime);
        } catch (uploadErr) {
          console.warn("[upload-documents] Failed to upload to object storage, using direct fallback:", uploadErr);
        }
      }

      const internalUrl = storageUrl || `direct://docs/${uuidv4()}/${encodeURIComponent(file.name)}`;

      return new Response(
        JSON.stringify({
          success: true,
          url: internalUrl,
          name: file.name,
          type: mime,
          size: file.size,
          content: extractedContent,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
