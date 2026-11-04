import type { IncomingMessage, ServerResponse } from "http";

export async function handleDevApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  let urlString = req.url || "/";
  if (!urlString.startsWith("/api")) {
    return false;
  }

  const method = (req.method || "GET").toUpperCase();

  // 0. Handle CORS preflight
  if (method === "OPTIONS") {
    const origin = (req.headers.origin as string) || "*";
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.end();
    return true;
  }

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.headers.referer?.startsWith("https") ? "https" : "http");
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.headers.host ||
    "localhost:3001";
  const urlObj = new URL(urlString, `${proto}://${host}`);
  let pathname = urlObj.pathname;

  // Support Vercel catch-all query parameters if rewritten
  if ((pathname === "/api" || pathname === "/api/") && (req as any).query?.path) {
    const segments = Array.isArray((req as any).query.path)
      ? (req as any).query.path
      : [(req as any).query.path];
    pathname = `/api/${segments.join("/")}`;
    urlObj.pathname = pathname;
  }

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
    body: bodyBuffer as any,
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
        "/api/superadmin/organization/create": () => import("./routes/api/superadmin/organization/create"),
        "/api/superadmin/organization/update": () => import("./routes/api/superadmin/organization/update"),
        "/api/superadmin/organization/delete": () => import("./routes/api/superadmin/organization/delete"),
        "/api/superadmin/organization/features": () => import("./routes/api/superadmin/organization/features"),
        "/api/superadmin/user/create": () => import("./routes/api/superadmin/user/create"),
        "/api/superadmin/user/update": () => import("./routes/api/superadmin/user/update"),
        "/api/superadmin/user/delete": () => import("./routes/api/superadmin/user/delete"),
        "/api/superadmin/user/reset-password": () => import("./routes/api/superadmin/user/reset-password"),
        "/api/superadmin/user/impersonate": () => import("./routes/api/superadmin/user/impersonate"),
        "/api/superadmin/chatbot/delete": () => import("./routes/api/superadmin/chatbot/delete"),
        "/api/superadmin/models": () => import("./routes/api/superadmin/models"),
        "/api/models": () => import("./routes/api/models"),
        "/api/organization": () => import("./routes/api/organization"),
        "/api/subscription/limits": () => import("./routes/api/subscription/limits"),
        "/api/system-status": () => import("./routes/api/system-status"),
        "/api/chatbots": () => import("./routes/api/chatbots"),
        "/api/my-chatbot": () => import("./routes/api/my-chatbot"),
        "/api/chatbot-count": () => import("./routes/api/chatbot-count"),
        "/api/set-active-chatbot": () => import("./routes/api/set-active-chatbot"),
        "/api/invite-member": () => import("./routes/api/invite-member"),
        "/api/crawl": () => import("./routes/api/crawl"),
        "/api/firecrawl-webhook": () => import("./routes/api/firecrawl-webhook"),
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
        "/api/neon-function": () => import("./routes/api/neon-function"),
        "/api/realtime-seal": () => import("./routes/api/realtime-seal"),
        "/api/checkout": () => import("./routes/api/checkout"),
        "/api/webhook/paystack": () => import("./routes/api/webhook/paystack"),
        "/api/webhook/polar": () => import("./routes/api/webhook/polar"),
        "/api/embed/generate-token": () => import("./routes/api/embed/generate-token"),
        "/api/onboarding/complete": () => import("./routes/api/onboarding/complete"),
        "/api/accept-invitation": () => import("./routes/api/accept-invitation"),
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

    // Handle multi-value Set-Cookie headers cleanly
    const getSetCookie = (response.headers as any).getSetCookie;
    if (typeof getSetCookie === "function") {
      const cookies = getSetCookie.call(response.headers);
      if (Array.isArray(cookies) && cookies.length > 0) {
        res.setHeader("set-cookie", cookies);
      }
    }

    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        res.setHeader(key, val);
      }
    });

    if (req.headers.origin && !res.getHeader("access-control-allow-origin")) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin as string);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

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
