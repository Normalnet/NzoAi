import { createServerFileRoute } from "@/lib/server-route";
import { v4 as uuidv4 } from "uuid";
import { requireAuthSession } from "../../middlewares/auth";

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
      const base64 = buffer.toString("base64");
      const mime = file.type || "application/octet-stream";
      // In production GCS is used. In dev or local, data URL or local file path
      const publicUrl = `data:${mime};base64,${base64}`;

      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          name: file.name,
          type: mime,
          size: file.size,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
