import type { IncomingMessage, ServerResponse } from "http";

export async function handleDevApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const urlString = req.url || "/";
  if (!urlString.startsWith("/api")) {
    return false;
  }

  const host = req.headers.host || "localhost:3001";
  const urlObj = new URL(urlString, `http://${host}`);
  const pathname = urlObj.pathname;
  const method = (req.method || "GET").toUpperCase();

  // Read request body for non-GET/HEAD methods
  let bodyBuffer: Buffer | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    bodyBuffer = Buffer.concat(chunks);
  }

  // Construct Web Standard Headers
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        val.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, val);
      }
    }
  }

  // Construct Web Standard Request
  const webRequest = new Request(urlObj.href, {
    method,
    headers,
    body: bodyBuffer,
  });

  try {
    let response: Response | null = null;

    // 1. Better Auth catch-all handler: /api/auth/*
    if (pathname.startsWith("/api/auth")) {
      const { auth } = await import("../auth");
      response = await auth.handler(webRequest);
    } else {
      // 2. Static Route Map
      const routeMap: Record<string, () => Promise<{ ServerRoute: any }>> = {
        "/api/superadmin/overview": () => import("./routes/api/superadmin/overview"),
        "/api/subscription/limits": () => import("./routes/api/subscription/limits"),
        "/api/system-status": () => import("./routes/api/system-status"),
        "/api/chatbots": () => import("./routes/api/chatbots"),
        "/api/my-chatbot": () => import("./routes/api/my-chatbot"),
        "/api/chatbot-count": () => import("./routes/api/chatbot-count"),
        "/api/set-active-chatbot": () => import("./routes/api/set-active-chatbot"),
        "/api/invite-member": () => import("./routes/api/invite-member"),
        "/api/crawl": () => import("./routes/api/crawl"),
        "/api/scrape": () => import("./routes/api/scrape"),
        "/api/chat": () => import("./routes/api/chat"),
        "/api/chat/history": () => import("./routes/api/chat/history"),
        "/api/chat/assign-agent": () => import("./routes/api/chat/assign-agent"),
        "/api/update-chat-status": () => import("./routes/api/update-chat-status"),
        "/api/vote": () => import("./routes/api/vote"),
        "/api/vote-count": () => import("./routes/api/vote-count"),
        "/api/document-source": () => import("./routes/api/document-source"),
        "/api/text-sources": () => import("./routes/api/text-sources"),
        "/api/questions": () => import("./routes/api/questions"),
        "/api/sources/count": () => import("./routes/api/sources/count"),
        "/api/train-agent": () => import("./routes/api/train-agent"),
        "/api/training-status": () => import("./routes/api/training-status"),
        "/api/leads": () => import("./routes/api/leads"),
        "/api/feedback": () => import("./routes/api/feedback"),
        "/api/report-issue": () => import("./routes/api/report-issue"),
        "/api/activity": () => import("./routes/api/activity"),
        "/api/visitor-analytics": () => import("./routes/api/visitor-analytics"),
        "/api/agent-actions": () => import("./routes/api/agent-actions"),
        "/api/upload-documents": () => import("./routes/api/upload-documents"),
        "/api/upload-images": () => import("./routes/api/upload-images"),
        "/api/checkout": () => import("./routes/api/checkout"),
        "/api/webhook/polar": () => import("./routes/api/webhook/polar"),
        "/api/embed/generate-token": () => import("./routes/api/embed/generate-token"),
      };

      if (routeMap[pathname]) {
        const mod = await routeMap[pathname]();
        const handler = mod.ServerRoute?.handlers?.[method];
        if (handler) {
          response = await handler({ request: webRequest, params: {} });
        } else {
          response = new Response(JSON.stringify({ error: `Method ${method} not allowed` }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else if (pathname.startsWith("/api/embed/chat/")) {
        const platformIdentifier = pathname.replace("/api/embed/chat/", "");
        const mod = await import("./routes/api/embed/chat/$platformIdentifier");
        const handler = mod.ServerRoute?.handlers?.[method];
        if (handler) {
          response = await handler({ request: webRequest, params: { platformIdentifier } });
        }
      } else if (pathname.startsWith("/api/embed/chatbot/")) {
        const identifier = pathname.replace("/api/embed/chatbot/", "");
        const mod = await import("./routes/api/embed/chatbot/$identifier");
        const handler = mod.ServerRoute?.handlers?.[method];
        if (handler) {
          response = await handler({ request: webRequest, params: { identifier } });
        }
      }
    }

    if (!response) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `API route not found: ${pathname}` }));
      return true;
    }

    // Write back standard Web Response to Node ServerResponse
    res.statusCode = response.status;
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
    return true;
  } catch (err: any) {
    console.error("[dev-api-error]:", err);
    res.statusCode = err.statusCode || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message || "Internal server error" }));
    return true;
  }
}
