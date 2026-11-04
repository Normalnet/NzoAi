import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleDevApiRequest } from "./dev-api-dispatcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In dev or tsx, __dirname is apps/web/src; dist is at apps/web/dist
const distDir = path.resolve(__dirname, "../dist");
const publicDir = path.resolve(__dirname, "../public");
const port = Number(process.env.PORT) || 3001;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  const urlString = req.url || "/";
  const host = req.headers.host || `localhost:${port}`;
  const urlObj = new URL(urlString, `http://${host}`);
  const pathname = urlObj.pathname;

  // 1. Dispatch API Requests
  if (pathname.startsWith("/api")) {
    try {
      const handled = await handleDevApiRequest(req, res);
      if (handled) return;
    } catch (err: any) {
      console.error("[server] Error handling API request:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message || "Internal server error" }));
      return;
    }
  }

  // 2. Prevent path traversal attacks
  const safePath = path.normalize(urlObj.pathname).replace(/^(\.\.[\/\\])+/, "");

  // Check if requesting an existing file in dist/
  let filePath = path.join(distDir, safePath);
  let fileExists = false;

  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fileExists = true;
    }
  } catch {
    // If not in dist, check public/ as fallback
    try {
      const publicFilePath = path.join(publicDir, safePath);
      const publicStat = fs.statSync(publicFilePath);
      if (publicStat.isFile()) {
        filePath = publicFilePath;
        fileExists = true;
      }
    } catch {}
  }

  // 3. Serve Static File
  if (fileExists) {
    const contentType = getContentType(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);

    // Immutable caching for hashed assets
    if (safePath.startsWith("/assets/") || safePath.startsWith("assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  // 4. SPA Fallback: Serve index.html for all non-file client routes
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const stream = fs.createReadStream(indexPath);
    stream.pipe(res);
    return;
  }

  // 5. If index.html is missing (build not yet run)
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end("<h1>NzoAI Web: Application build not found. Please run 'pnpm build' first.</h1>");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[nzoai-web] Production server listening on http://0.0.0.0:${port}`);
});
