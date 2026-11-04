import { createServerFileRoute } from "@/lib/server-route";
import { requireAuthSession } from "../../middlewares/auth";
import { db } from "../../db";
import { subscription, user } from "../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Pricing table in GHS (Ghana Cedis in pesewas: 1 GHS = 100 pesewas) and USD (cents)
const PLAN_PRICING: Record<string, { ghs: number; usd: number; name: string; tier: string }> = {
  starter: { ghs: 40000, usd: 2900, name: "Starter", tier: "starter" },
  starter_monthly: { ghs: 40000, usd: 2900, name: "Starter", tier: "starter" },
  growth: { ghs: 110000, usd: 7900, name: "Growth", tier: "growth" },
  growth_monthly: { ghs: 110000, usd: 7900, name: "Growth", tier: "growth" },
  pro: { ghs: 280000, usd: 19900, name: "Professional", tier: "pro" },
  pro_monthly: { ghs: 280000, usd: 19900, name: "Professional", tier: "pro" },
};

export const ServerRoute = createServerFileRoute("/api/checkout").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const productId = (url.searchParams.get("products") || url.searchParams.get("plan") || "starter").toLowerCase();
    const currency = (url.searchParams.get("currency") || "GHS").toUpperCase(); // GHS or USD

    let authSession: any = null;
    try {
      authSession = await requireAuthSession(request);
    } catch {
      // If not logged in, redirect to login with callback
      return Response.redirect(`${url.origin}/login?redirect=${encodeURIComponent(url.pathname + url.search)}`, 302);
    }

    const planInfo = PLAN_PRICING[productId] || PLAN_PRICING["starter"];
    const amount = currency === "USD" ? planInfo.usd : planInfo.ghs;
    const orgId = authSession.session.activeOrganizationId || null;
    const userId = authSession.user.id;
    const userEmail = authSession.user.email;

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Development fallback if Paystack secret is not configured
    if (!paystackSecret) {
      console.warn("[checkout] PAYSTACK_SECRET_KEY is not set. Simulating instant local subscription.");
      if (orgId) {
        const subId = `sub_mock_${uuidv4().slice(0, 8)}`;
        const existing = await db.query.subscription.findFirst({
          where: eq(subscription.referenceId, orgId),
        });

        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (existing) {
          await db
            .update(subscription)
            .set({
              status: "active",
              productId: planInfo.tier,
              amount: Math.round(amount / 100),
              currency: currency.toLowerCase(),
              periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscription.id, existing.id));
        } else {
          await db.insert(subscription).values({
            id: subId,
            userId,
            referenceId: orgId,
            status: "active",
            productId: planInfo.tier,
            amount: Math.round(amount / 100),
            currency: currency.toLowerCase(),
            recurringInterval: "month",
            periodStart: new Date(),
            periodEnd,
            customerId: `cus_mock_${userId}`,
            checkoutId: `ref_mock_${Date.now()}`,
          });
        }

        await db
          .update(user)
          .set({ isSubscribed: true, updatedAt: new Date() })
          .where(eq(user.id, userId));
      }

      return Response.redirect(`${url.origin}/admin/subscription?status=success&plan=${planInfo.tier}&mock=true`, 302);
    }

    // Call Paystack Transaction Initialize API
    try {
      const callbackUrl = `${url.origin}/admin/subscription?status=success&plan=${planInfo.tier}`;

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount, // Amount in lowest subunit (pesewas / cents)
          currency,
          channels: ["mobile_money", "card"],
          callback_url: callbackUrl,
          metadata: {
            userId,
            organizationId: orgId,
            productId: planInfo.tier,
            planName: planInfo.name,
            currency,
          },
        }),
      });

      const data = await res.json();

      if (data?.status && data?.data?.authorization_url) {
        return Response.redirect(data.data.authorization_url, 302);
      } else {
        console.error("[checkout] Paystack initialization failed:", data);
        return new Response(
          JSON.stringify({ error: data?.message || "Failed to initialize Paystack checkout" }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err: any) {
      console.error("[checkout] Error contacting Paystack:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
});
