import React, { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Building2, Palette, Bot, Users, Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Wizard state
  const [orgName, setOrgName] = useState("");
  const [botName, setBotName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#800020");
  const [personality, setPersonality] = useState("support");
  const [teammateEmail, setTeammateEmail] = useState("");

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        // Create or configure chatbot
        await fetch("/api/my-chatbot", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: botName || `${orgName} Assistant`,
            primaryColor,
            personality,
          }),
        });

        router.navigate({ to: "/admin/overview" });
      } catch (err) {
        console.error(err);
        router.navigate({ to: "/admin/overview" });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-xl shadow-xl border">
        {/* Step indicator */}
        <div className="px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-3">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && "Organization"}
              {step === 2 && "Appearance"}
              {step === 3 && "Personality"}
              {step === 4 && "Team"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`rounded-full transition-colors ${
                  s <= step ? "bg-[#800020]" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <CardContent className="p-8">
          {/* Step 1: Organization Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">What is your company or organization name?</h2>
                <p className="text-xs text-muted-foreground">This helps personalize your workspace and chatbot brand.</p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-foreground">Organization Name</label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Appearance */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Customize your Bot's Appearance</h2>
                <p className="text-xs text-muted-foreground">Pick a name and primary color to match your brand website.</p>
              </div>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Chatbot Name</label>
                  <Input
                    placeholder="e.g. Support Bot"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-md border cursor-pointer p-0.5"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Personality / Use Case */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Choose Agent Persona & Mission</h2>
                <p className="text-xs text-muted-foreground">Select how your AI agent should interact with visitors.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: "support", title: "Customer Support", desc: "Empathetic, accurate answers to inquiries" },
                  { id: "sales", title: "Sales Specialist", desc: "Consultative, guides visitors to demos and quotes" },
                  { id: "lead", title: "Lead Generation", desc: "Friendly assistant focused on contact capture" },
                  { id: "custom", title: "Custom Agent", desc: "Fully tailored instructions & responses" },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPersonality(item.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      personality === item.id
                        ? "border-[#800020] bg-primary/5 shadow-xs"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Invite Teammates */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Invite Teammates (Optional)</h2>
                <p className="text-xs text-muted-foreground">Add colleagues to collaborate as human escalation agents.</p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-foreground">Teammate Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={teammateEmail}
                  onChange={(e) => setTeammateEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between pt-8 border-t mt-8">
            {step > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : <div />}

            <Button
              size="sm"
              className="text-xs text-white bg-[#800020] hover:bg-[#800020]/90 gap-1.5"
              onClick={handleNext}
              disabled={loading || (step === 1 && !orgName.trim())}
            >
              <span>{step === 4 ? (loading ? "Finalizing Setup..." : "Launch Workspace") : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
