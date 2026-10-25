import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl text-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold">Subscription Activated!</CardTitle>
        <p className="text-sm text-muted-foreground">
          Thank you for subscribing to NzoAI. Your workspace is now fully provisioned and ready for custom chatbot deployment.
        </p>
        <div className="pt-4">
          <Link to="/admin/overview">
            <Button className="w-full text-white bg-[#800020] hover:bg-[#800020]/90 gap-2">
              <span>Go to Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
