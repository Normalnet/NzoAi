import React, { useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, ShieldCheck, Smartphone, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/choose-plan")({
  component: ChoosePlanPage,
});

function ChoosePlanPage() {
  const [currency, setCurrency] = useState<"GHS" | "USD">("GHS");

  // Read search params safely
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const isSuccess = searchParams.get("status") === "success";

  const plans = [
    {
      id: "starter",
      name: "Starter",
      priceGHS: "GH₵ 400",
      priceUSD: "$29",
      features: [
        "1 AI Chatbot",
        "2 Team Seats",
        "Knowledge Base RAG (PDF, DOCX, TXT)",
        "Embeddable Widget & Talk Page",
        "1,000 AI Credits / month",
      ],
      productId: "starter",
    },
    {
      id: "growth",
      name: "Growth",
      priceGHS: "GH₵ 1,100",
      priceUSD: "$79",
      popular: true,
      features: [
        "3 AI Chatbots",
        "5 Team Seats",
        "Real-time WebSocket Human Takeover",
        "Firecrawl Web Crawler & Scraper",
        "5,000 AI Credits / month",
        "Custom Lead Collection Actions",
      ],
      productId: "growth",
    },
    {
      id: "pro",
      name: "Professional",
      priceGHS: "GH₵ 2,800",
      priceUSD: "$199",
      features: [
        "5 AI Chatbots",
        "10 Team Seats",
        "White-label Branding & Logo Customization",
        "25,000 AI Credits / month",
        "Calendly / Cal.com Meeting Booking",
        "Priority Support & Escalation Webhooks",
      ],
      productId: "pro",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-16 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Success Banner */}
        {isSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-sm">
                Payment successful! Your subscription is now active.
              </span>
            </div>
            <Link to="/admin">
              <Button size="sm" className="text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Select your Subscription Plan</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Choose a tier to activate full platform access, real-time customer escalations, and unlimited chatbot training.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center bg-muted p-1 rounded-xl border text-xs font-semibold">
            <button
              onClick={() => setCurrency("GHS")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currency === "GHS" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              GH₵ Ghana Cedi (Mobile Money)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currency === "USD" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              $ USD (Card)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`flex flex-col justify-between transition-all ${
                p.popular ? "border-2 border-primary shadow-xl relative" : "hover:border-primary/50"
              }`}
            >
              {p.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow"
                  style={{ backgroundColor: "#800020" }}
                >
                  Most Popular in Ghana
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                <div className="text-3xl font-extrabold mt-2">
                  {currency === "GHS" ? p.priceGHS : p.priceUSD}
                  <span className="text-xs text-muted-foreground font-normal">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 pt-4 border-t">
                  <a href={`/api/checkout?products=${p.productId}&currency=${currency}`}>
                    <Button
                      className="w-full text-xs text-white shadow-sm"
                      style={{ backgroundColor: "#800020" }}
                    >
                      <span>Pay with Paystack</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>

                  {/* Payment Methods Info */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <Smartphone className="w-3 h-3 text-amber-500" />
                    <span>MTN / Telecel / AT MoMo</span>
                    <span>•</span>
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <span>Cards</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security & Local Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured by Paystack Ghana. Payments processed in GHS and USD. Cancel anytime.</span>
        </div>
      </div>
    </div>
  );
}
