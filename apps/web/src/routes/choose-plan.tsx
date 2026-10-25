import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/choose-plan")({
  component: ChoosePlanPage,
});

function ChoosePlanPage() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$29",
      features: ["1 AI Chatbot", "2 Team Seats", "Knowledge Base RAG", "Embed Widget"],
      productId: "starter_monthly",
    },
    {
      id: "growth",
      name: "Growth",
      price: "$79",
      popular: true,
      features: ["3 AI Chatbots", "5 Team Seats", "Realtime WebSocket Escalation", "Firecrawl Scraper"],
      productId: "growth_monthly",
    },
    {
      id: "pro",
      name: "Professional",
      price: "$199",
      features: ["5 AI Chatbots", "10 Team Seats", "White-label Branding", "Priority Support"],
      productId: "pro_monthly",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-16 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Select your Subscription Plan</h1>
          <p className="text-sm text-muted-foreground">Choose a tier to activate full platform access and unlimited training.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card key={p.id} className={`flex flex-col justify-between ${p.popular ? "border-2 border-primary shadow-lg" : ""}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                <div className="text-3xl font-extrabold mt-2">{p.price}<span className="text-xs text-muted-foreground font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <a href={`/api/checkout?products=${p.productId}`}>
                  <Button className="w-full text-xs text-white" style={{ backgroundColor: "#800020" }}>
                    <span>Select {p.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
