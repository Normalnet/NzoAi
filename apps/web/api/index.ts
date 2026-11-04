import type { IncomingMessage, ServerResponse } from "node:http";
import { handleDevApiRequest } from "../src/dev-api-dispatcher.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleDevApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `API route not found: ${req.url}` }));
    }
  } catch (err: any) {
    console.error("[vercel-api-handler-error]:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
  }
}
