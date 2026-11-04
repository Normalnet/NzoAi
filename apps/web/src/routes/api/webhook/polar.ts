import { createServerFileRoute } from "@/lib/server-route";
import { ServerRoute as PaystackWebhook } from "./paystack";

// Backward-compatibility alias: Forward all requests to Paystack webhook handler
export const ServerRoute = createServerFileRoute("/api/webhook/polar").methods({
  POST: async (ctx) => {
    return PaystackWebhook.handlers.POST(ctx);
  },
});
