import type { IncomingMessage, ServerResponse } from "node:http";
import { handleDevApiRequest } from "./dev-api-dispatcher";

/**
 * Single Vercel serverless entry for every /api/* request.
 * Bundled by vercel-build.mjs into .vercel/output/functions/api.func.
 * The route config forwards the original sub-path as `__path` so we can
 * rebuild the real URL regardless of how the platform rewrites req.url.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || "/", "http://internal");
    const forwardedPath = url.searchParams.get("__path");
    if (forwardedPath !== null) {
      url.searchParams.delete("__path");
      const qs = url.searchParams.toString();
      req.url = `/api/${forwardedPath.replace(/^\/+/, "")}${qs ? `?${qs}` : ""}`;
    }

    const handled = await handleDevApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `API route not found: ${req.url}` }));
    }
  } catch (err: any) {
    console.error("[vercel-api-handler-error]:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
  }
}
