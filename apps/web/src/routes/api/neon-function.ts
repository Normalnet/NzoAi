import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/neon-function").methods({
  GET: async () => {
    const neonFunctionUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
    if (!neonFunctionUrl) {
      return new Response(JSON.stringify({ error: "NEON_FUNCTION_HELLO_BASE_URL is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const res = await fetch(neonFunctionUrl);
      const text = await res.text();
      return new Response(
        JSON.stringify({
          ok: res.ok,
          status: res.status,
          url: neonFunctionUrl,
          message: text,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message, url: neonFunctionUrl }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
