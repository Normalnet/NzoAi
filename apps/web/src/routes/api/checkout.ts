import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/checkout").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get("products") || "";

    // In a live Polar environment, redirect to Polar checkout session
    // In local dev, redirect to /success
    const checkoutUrl = process.env.POLAR_ACCESS_TOKEN
      ? `https://polar.sh/checkout/${productId}?success_url=${encodeURIComponent(
          `${url.origin}/success`
        )}`
      : `${url.origin}/success`;

    return Response.redirect(checkoutUrl, 302);
  },
});
