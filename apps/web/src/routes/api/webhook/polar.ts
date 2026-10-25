import { createServerFileRoute } from "@/lib/server-route";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { subscription, user } from "../../../db/schema";

export const ServerRoute = createServerFileRoute("/api/webhook/polar").methods({
  POST: async ({ request }) => {
    try {
      const rawBody = await request.text();
      const payload = JSON.parse(rawBody);

      const eventType = payload.type;
      const data = payload.data;

      if (eventType && eventType.startsWith("subscription.")) {
        const subId = data.id;
        const customerId = data.customer_id;
        const status = data.status;
        const referenceId = data.metadata?.organizationId || data.metadata?.referenceId || null;
        const userId = data.metadata?.userId || data.user_id;

        if (userId) {
          // Upsert subscription
          const existing = await db.query.subscription.findFirst({
            where: eq(subscription.id, subId),
          });

          if (existing) {
            await db
              .update(subscription)
              .set({
                status,
                amount: data.amount,
                currency: data.currency,
                recurringInterval: data.recurring_interval,
                periodStart: data.current_period_start ? new Date(data.current_period_start) : null,
                periodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
                cancelAtPeriodEnd: data.cancel_at_period_end || false,
                updatedAt: new Date(),
              })
              .where(eq(subscription.id, subId));
          } else {
            await db.insert(subscription).values({
              id: subId,
              userId,
              referenceId,
              status,
              amount: data.amount,
              currency: data.currency,
              recurringInterval: data.recurring_interval,
              periodStart: data.current_period_start ? new Date(data.current_period_start) : null,
              periodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
              cancelAtPeriodEnd: data.cancel_at_period_end || false,
              customerId,
              productId: data.product_id,
            });
          }

          // Mark user as subscribed
          await db
            .update(user)
            .set({ isSubscribed: status === "active" || status === "trialing", updatedAt: new Date() })
            .where(eq(user.id, userId));
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[polar webhook error]:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  },
});
