import { createServerFileRoute } from "@/lib/server-route";
import { requireAuthSession } from "../../middlewares/auth";
import { getStorageClient, uploadToStorage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export const ServerRoute = createServerFileRoute("/api/upload-images").methods({
  POST: async ({ request }) => {
    try {
      await requireAuthSession(request);

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return new Response(JSON.stringify({ error: "No image file provided" }), { status: 400 });
      }

      // Max 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Image exceeds 5MB limit" }), { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/png";
      let publicUrl = "";

      const storageClient = getStorageClient();
      if (storageClient) {
        const key = `images/${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        publicUrl = await uploadToStorage(key, buffer, mime);
      } else {
        const base64 = buffer.toString("base64");
        publicUrl = `data:${mime};base64,${base64}`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
