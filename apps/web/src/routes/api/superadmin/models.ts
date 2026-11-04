import { createServerFileRoute } from "@/lib/server-route";
import { requireSuperAdmin } from "../../../middlewares/auth";
import { fetchPlatformModelsFromDB, AIModelDefinition } from "../../../lib/ai/models";
import { db } from "../../../db";
import { aiModel } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/superadmin/models").methods({
  GET: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const models = await fetchPlatformModelsFromDB();
      return new Response(JSON.stringify({ models }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  // Add or Edit a model
  POST: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();

      // If array is passed, bulk update
      if (Array.isArray(body?.models)) {
        for (const m of body.models) {
          await db
            .insert(aiModel)
            .values({
              id: m.id,
              displayName: m.displayName,
              provider: m.provider,
              description: m.description,
              badge: m.badge || null,
              category: m.category || "standard",
              apiKey: m.apiKey || null,
              apiEndpoint: m.apiEndpoint || null,
              temperature: m.temperature || 70,
              tierRequired: m.tierRequired || "all",
              isActive: m.isActive !== false,
              isDefault: !!m.isDefault,
              orderIndex: m.orderIndex || 0,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: aiModel.id,
              set: {
                displayName: m.displayName,
                provider: m.provider,
                description: m.description,
                badge: m.badge || null,
                category: m.category || "standard",
                apiKey: m.apiKey || null,
                apiEndpoint: m.apiEndpoint || null,
                temperature: m.temperature || 70,
                tierRequired: m.tierRequired || "all",
                isActive: m.isActive !== false,
                isDefault: !!m.isDefault,
                updatedAt: new Date(),
              },
            });
        }
        const updated = await fetchPlatformModelsFromDB();
        return new Response(
          JSON.stringify({ success: true, message: "Models updated successfully.", models: updated }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Single model create or update
      const {
        id,
        displayName,
        provider,
        description,
        badge,
        category,
        apiKey,
        apiEndpoint,
        temperature,
        tierRequired,
        isActive,
        isDefault,
      } = body;

      if (!id || !displayName || !provider) {
        return new Response(
          JSON.stringify({ error: "Model identifier, display name, and provider are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const cleanId = id.trim().toLowerCase();

      // If setting this as default, unset other defaults
      if (isDefault) {
        await db.update(aiModel).set({ isDefault: false });
      }

      await db
        .insert(aiModel)
        .values({
          id: cleanId,
          displayName: displayName.trim(),
          provider: provider.trim().toLowerCase(),
          description: description?.trim() || `Advanced ${provider} AI model.`,
          badge: badge?.trim() || null,
          category: category || "standard",
          apiKey: apiKey?.trim() || null,
          apiEndpoint: apiEndpoint?.trim() || null,
          temperature: typeof temperature === "number" ? temperature : 70,
          tierRequired: tierRequired || "all",
          isActive: isActive !== false,
          isDefault: !!isDefault,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: aiModel.id,
          set: {
            displayName: displayName.trim(),
            provider: provider.trim().toLowerCase(),
            description: description?.trim() || `Advanced ${provider} AI model.`,
            badge: badge?.trim() || null,
            category: category || "standard",
            apiKey: apiKey?.trim() || null,
            apiEndpoint: apiEndpoint?.trim() || null,
            temperature: typeof temperature === "number" ? temperature : 70,
            tierRequired: tierRequired || "all",
            isActive: isActive !== false,
            isDefault: !!isDefault,
            updatedAt: new Date(),
          },
        });

      const updatedList = await fetchPlatformModelsFromDB();

      return new Response(
        JSON.stringify({
          success: true,
          message: `Model "${displayName}" saved to AI stack successfully.`,
          models: updatedList,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  // Delete a model
  DELETE: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const url = new URL(request.url);
      const modelId = url.searchParams.get("id");

      if (!modelId) {
        return new Response(JSON.stringify({ error: "Model ID is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.delete(aiModel).where(eq(aiModel.id, modelId));
      const updatedList = await fetchPlatformModelsFromDB();

      return new Response(
        JSON.stringify({
          success: true,
          message: `Model "${modelId}" removed from platform catalog.`,
          models: updatedList,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },

  // Toggle active status or default
  PATCH: async ({ request }) => {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { id, isActive, isDefault } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Model ID is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updates: any = { updatedAt: new Date() };
      if (typeof isActive === "boolean") updates.isActive = isActive;

      if (isDefault) {
        await db.update(aiModel).set({ isDefault: false });
        updates.isDefault = true;
      }

      await db.update(aiModel).set(updates).where(eq(aiModel.id, id));
      const updatedList = await fetchPlatformModelsFromDB();

      return new Response(
        JSON.stringify({
          success: true,
          models: updatedList,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
    }
  },
});
