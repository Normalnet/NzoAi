import { createServerFileRoute } from "@/lib/server-route";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { subscription, user } from "../../../db/schema";
import { v4 as uuidv4 } from "uuid";

export const ServerRoute = createServerFileRoute("/api/webhook/paystack").methods({
  POST: async ({ request }) => {
    try {
      const rawBody = await request.text();
      const signature = request.headers.get("x-paystack-signature");
      const secret = process.env.PAYSTACK_SECRET_KEY;

      // Verify HMAC-SHA512 Signature if secret is configured
      if (secret && signature) {
        const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
        if (hash !== signature) {
          console.warn("[paystack-webhook] Signature mismatch! Rejecting request.");
          return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
        }
      }

      const body = JSON.parse(rawBody);
      const event = body.event;
      const data = body.data;

      console.log(`[paystack-webhook] Received event: ${event}, Reference: ${data?.reference || "N/A"}`);

      if (event === "charge.success") {
        const reference = data.reference;
        const amount = Math.round((data.amount || 0) / 100);
        const currency = (data.currency || "GHS").toLowerCase();
        const customerCode = data.customer?.customer_code || null;
        const channel = data.channel || "mobile_money"; // 'mobile_money' | 'card'

        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const orgId = metadata.organizationId;
        const tier = metadata.productId || "starter";

        if (orgId || userId) {
          try {
            // Check for existing subscription for this org or user
            let existing = null;
            if (orgId) {
              existing = await db.query.subscription.findFirst({
                where: eq(subscription.referenceId, orgId),
              });
            } else if (userId) {
              existing = await db.query.subscription.findFirst({
                where: eq(subscription.userId, userId),
              });
            }

            const now = new Date();
            const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days active

            if (existing) {
              await db
                .update(subscription)
                .set({
                  status: "active",
                  amount,
                  currency,
                  productId: tier,
                  customerId: customerCode || existing.customerId,
                  checkoutId: reference,
                  periodStart: now,
                  periodEnd,
                  cancelAtPeriodEnd: false,
                  meters: {
                    channel,
                    authorization: data.authorization,
                    bank: data.authorization?.bank || data.authorization?.channel,
                  },
                  updatedAt: now,
                })
                .where(eq(subscription.id, existing.id));
            } else if (userId) {
              await db.insert(subscription).values({
                id: `sub_${uuidv4().slice(0, 12)}`,
                userId,
                referenceId: orgId || null,
                status: "active",
                amount,
                currency,
                recurringInterval: "month",
                periodStart: now,
                periodEnd,
                cancelAtPeriodEnd: false,
                customerId: customerCode,
                productId: tier,
                checkoutId: reference,
                meters: {
                  channel,
                  authorization: data.authorization,
                  bank: data.authorization?.bank || data.authorization?.channel,
                },
              });
            }

            if (userId) {
              await db
                .update(user)
                .set({ isSubscribed: true, updatedAt: now })
                .where(eq(user.id, userId));
            }

            console.log(`[paystack-webhook] Successfully activated subscription for org: ${orgId}, user: ${userId}, tier: ${tier}`);
          } catch (dbErr: any) {
            console.error("[paystack-webhook] Database error while recording subscription:", dbErr.message || dbErr);
          }
        }
      } else if (event === "subscription.disable" || event === "subscription.not_renew") {
        const customerCode = data.customer?.customer_code;
        if (customerCode) {
          try {
            const sub = await db.query.subscription.findFirst({
              where: eq(subscription.customerId, customerCode),
            });
            if (sub) {
              await db
                .update(subscription)
                .set({ status: "canceled", cancelAtPeriodEnd: true, updatedAt: new Date() })
                .where(eq(subscription.id, sub.id));
            }
          } catch (dbErr: any) {
            console.error("[paystack-webhook] Database error while canceling subscription:", dbErr.message || dbErr);
          }
        }
      } else if (event === "invoice.payment_failed") {
        const customerCode = data.customer?.customer_code;
        if (customerCode) {
          try {
            const sub = await db.query.subscription.findFirst({
              where: eq(subscription.customerId, customerCode),
            });
            if (sub) {
              await db
                .update(subscription)
                .set({ status: "past_due", updatedAt: new Date() })
                .where(eq(subscription.id, sub.id));
            }
          } catch (dbErr: any) {
            console.error("[paystack-webhook] Database error while recording payment failure:", dbErr.message || dbErr);
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[paystack-webhook] Processing error:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  },
});
