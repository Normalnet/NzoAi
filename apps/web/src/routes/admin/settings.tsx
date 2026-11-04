import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Users,
  CreditCard,
  Plus,
  Mail,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Crown,
  Save,
  Coins,
  Settings as SettingsIcon,
  Cpu,
  Bot,
  Palette,
  Check,
  ArrowRight,
  Layers,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const COLOR_PRESETS = [
  { name: "Burgundy (Default)", hex: "#800020" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Deep Violet", hex: "#7C3AED" },
  { name: "Amber Orange", hex: "#EA580C" },
  { name: "Slate Midnight", hex: "#0F172A" },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"models" | "appearance" | "workspace" | "billing">("models");

  // Chatbot State
  const [chatbot, setChatbot] = useState<any>(null);
  const [botName, setBotName] = useState("");
  const [botColor, setBotColor] = useState("#800020");
  const [botPersonality, setBotPersonality] = useState("support");
  const [botGreeting, setBotGreeting] = useState("");
  const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
  const [newPromptInput, setNewPromptInput] = useState("");
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [botSaving, setBotSaving] = useState(false);
  const [botSuccess, setBotSuccess] = useState(false);

  // Available Models from Superadmin
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelSwitching, setModelSwitching] = useState<string | null>(null);

  // Workspace & Team state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Superadmin quick controls
  const [selectedPlanTier, setSelectedPlanTier] = useState("enterprise");
  const [grantCreditsAmount, setGrantCreditsAmount] = useState<number>(5000);
  const [superadminActionLoading, setSuperadminActionLoading] = useState(false);
  const [superadminActionMsg, setSuperadminActionMsg] = useState("");

  const [limitsData, setLimitsData] = useState<any>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);

  const fetchBotAndModels = async () => {
    try {
      // 1. Fetch Models
      setModelsLoading(true);
      const modRes = await fetch("/api/models");
      if (modRes.ok) {
        const modData = await modRes.json();
        if (Array.isArray(modData?.models)) {
          setAvailableModels(modData.models);
        }
      }
    } catch (e) {
      console.warn("Failed to load models catalog:", e);
    } finally {
      setModelsLoading(false);
    }

    try {
      // 2. Fetch Chatbot configuration
      const botRes = await fetch("/api/my-chatbot");
      if (botRes.ok) {
        const botData = await botRes.json();
        if (botData?.chatbot) {
          const b = botData.chatbot;
          setChatbot(b);
          setBotName(b.name || "NzoAI Assistant");
          setBotColor(b.primaryColor || "#800020");
          setBotPersonality(b.personality || "support");
          setBotGreeting(b.initialMessage || "Hello! How can I assist you today?");
          setSuggestedMessages(b.suggestedMessages || ["What services do you offer?", "How do I get in touch?"]);
          setHidePoweredBy(Boolean(b.hidePoweredBy));
          setSelectedModel(b.model || "gpt-4o-mini");
        }
      }
    } catch (e) {
      console.warn("Failed to load chatbot data:", e);
    }
  };

  const fetchLimitsAndMembers = async () => {
    try {
      const [limRes, memRes, orgRes] = await Promise.all([
        fetch("/api/subscription/limits"),
        fetch("/api/invite-member"),
        fetch("/api/organization"),
      ]);

      if (limRes.ok) {
        const lim = await limRes.json();
        setLimitsData(lim);
      }

      if (memRes.ok) {
        const mem = await memRes.json();
        setMembersList(mem.members || []);
        setInvitationsList(mem.invitations || []);
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        if (orgData?.organization) {
          setOrgName(orgData.organization.name || "");
          setOrgSlug(orgData.organization.slug || "");
        }
        if (orgData?.plan?.id) {
          setSelectedPlanTier(orgData.plan.id);
        }
      }
    } catch (err) {
      console.warn("Error fetching workspace settings data:", err);
    }
  };

  useEffect(() => {
    fetchBotAndModels();
    fetchLimitsAndMembers();
  }, []);

  // Switch Model Directly
  const handleSelectModel = async (modelId: string) => {
    setModelSwitching(modelId);
    try {
      const res = await fetch("/api/my-chatbot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId }),
      });
      if (res.ok) {
        setSelectedModel(modelId);
        setBotSuccess(true);
        setTimeout(() => setBotSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to update AI model:", e);
    } finally {
      setModelSwitching(null);
    }
  };

  // Save Chatbot Appearance & Persona
  const handleSaveBotSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotSaving(true);
    setBotSuccess(false);

    try {
      const res = await fetch("/api/my-chatbot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: botName,
          primaryColor: botColor,
          personality: botPersonality,
          initialMessage: botGreeting,
          suggestedMessages,
          hidePoweredBy,
          model: selectedModel,
        }),
      });

      if (res.ok) {
        setBotSuccess(true);
        setTimeout(() => setBotSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save chatbot settings:", err);
    } finally {
      setBotSaving(false);
    }
  };

  const handleAddSuggestedMessage = () => {
    if (newPromptInput.trim()) {
      setSuggestedMessages([...suggestedMessages, newPromptInput.trim()]);
      setNewPromptInput("");
    }
  };

  const handleRemoveSuggestedMessage = (index: number) => {
    setSuggestedMessages(suggestedMessages.filter((_, i) => i !== index));
  };

  // Organization update
  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    setOrgError("");
    setOrgSuccess(false);

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, slug: orgSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrgError(data.error || "Failed to update organization profile");
      } else {
        setOrgSuccess(true);
        setTimeout(() => setOrgSuccess(false), 4000);
      }
    } catch (err: any) {
      setOrgError(err.message || "Failed to update organization profile");
    } finally {
      setOrgSaving(false);
    }
  };

  // Superadmin Tier Override
  const handleSuperadminOverride = async (tier: string) => {
    setSuperadminActionLoading(true);
    setSuperadminActionMsg("");
    try {
      const res = await fetch("/api/superadmin/organization/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: limitsData?.organizationId || "dev_org_01",
          planTier: tier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuperadminActionMsg(`Plan successfully updated to ${tier.toUpperCase()}`);
        fetchLimitsAndMembers();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSuperadminActionLoading(false);
    }
  };

  // Superadmin Grant Credits
  const handleGrantCredits = async () => {
    setSuperadminActionLoading(true);
    setSuperadminActionMsg("");
    try {
      const res = await fetch("/api/superadmin/organization/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: limitsData?.organizationId || "dev_org_01",
          addCredits: Number(grantCreditsAmount) || 1000,
        }),
      });
      if (res.ok) {
        setSuperadminActionMsg(`Granted ${grantCreditsAmount} bonus credits!`);
        fetchLimitsAndMembers();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSuperadminActionLoading(false);
    }
  };

  // Send invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    setInviteError("");
    setInviteSent(false);

    try {
      const res = await fetch("/api/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to dispatch invitation.");
      } else {
        setInviteSent(true);
        setInviteEmail("");
        fetchLimitsAndMembers();
        setTimeout(() => setInviteSent(false), 4000);
      }
    } catch (err: any) {
      setInviteError(err.message || "Failed to dispatch invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuper = limitsData?.isSuperAdmin;
  const planName = isSuper ? "Platform Master" : limitsData?.plan?.name || "Starter";
  const userRole = isSuper ? "superadmin" : limitsData?.role || "member";
  const canInvite = isSuper || userRole === "owner" || userRole === "admin";
  const memberQuota = limitsData?.usage?.members;
  const botQuota = limitsData?.usage?.chatbots;

  const currentActiveModelObj = availableModels.find((m) => m.id === selectedModel);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace & AI Configuration</h1>
            {isSuper && (
              <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 gap-1 text-[11px] font-semibold">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>NzoAI Superadmin</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your active AI intelligence model, customize chatbot appearance, manage team access, and billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs px-2.5 py-1">
            Role: <span className="font-semibold capitalize ml-1">{userRole}</span>
          </Badge>
          <Badge
            className={`text-xs px-2.5 py-1 text-white ${
              isSuper ? "bg-amber-600" : "bg-[#800020]"
            }`}
          >
            {planName}
          </Badge>
        </div>
      </div>

      {/* Global Superadmin Master Bar */}
      {isSuper && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Platform Superadmin Operator Mode</p>
              <p className="text-muted-foreground mt-0.5">
                You have master authority to change models, override tiers, adjust credit quotas, or manage the entire platform.
              </p>
            </div>
          </div>
          <Link to="/superadmin">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shrink-0">
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Platform Backoffice</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "models"
              ? "border-[#800020] text-[#800020] dark:border-rose-400 dark:text-rose-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Engine & Models</span>
          {currentActiveModelObj && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
              {currentActiveModelObj.displayName}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "appearance"
              ? "border-[#800020] text-[#800020] dark:border-rose-400 dark:text-rose-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Chatbot Identity & Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "workspace"
              ? "border-[#800020] text-[#800020] dark:border-rose-400 dark:text-rose-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace & Team</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "billing"
              ? "border-[#800020] text-[#800020] dark:border-rose-400 dark:text-rose-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing & Subscription</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: AI ENGINE & MODEL SELECTION (TENANT MODEL SELECTOR)
          ========================================================================= */}
      {activeTab === "models" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 border rounded-2xl p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Select AI Intelligence Engine</h2>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Choose the foundation AI model that powers your customer support agent. NzoAI dynamically routes all live chat conversations and embed widgets through your selected model.
              </p>
            </div>

            {botSuccess && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI Model Updated!</span>
              </div>
            )}
          </div>

          {/* Model Selection Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableModels.map((model) => {
              const isCurrent = selectedModel === model.id;
              const isSwitching = modelSwitching === model.id;

              return (
                <div
                  key={model.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative ${
                    isCurrent
                      ? "border-[#800020] bg-[#800020]/5 shadow-sm ring-1 ring-[#800020]"
                      : "bg-card hover:border-foreground/30 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{model.displayName}</h3>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{model.id}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-bold tracking-wider py-0 px-2"
                        >
                          {model.provider}
                        </Badge>
                        {model.badge && (
                          <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 text-[9px] py-0 px-1.5">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  {/* Footer / Selector Button */}
                  <div className="pt-3 border-t flex items-center justify-between">
                    {isCurrent ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#800020] dark:text-rose-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Active for this Chatbot</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Ready to deploy</span>
                    )}

                    <Button
                      size="sm"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || isSwitching}
                      onClick={() => handleSelectModel(model.id)}
                      className={`h-8 text-xs gap-1.5 ${
                        isCurrent
                          ? "border-[#800020]/40 text-[#800020] cursor-default"
                          : "bg-[#800020] hover:bg-[#800020]/90 text-white"
                      }`}
                    >
                      {isSwitching ? (
                        <span>Activating...</span>
                      ) : isCurrent ? (
                        <span>Selected</span>
                      ) : (
                        <>
                          <span>Select Model</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Playground Test Callout */}
          <div className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Want to compare models before switching?</span>
                <p className="text-muted-foreground mt-0.5">
                  Test prompt answers in the Playground to evaluate response tone and latency side-by-side.
                </p>
              </div>
            </div>
            <Link to="/admin/playground">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 shrink-0">
                <span>Open AI Playground</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CHATBOT IDENTITY & APPEARANCE
          ========================================================================= */}
      {activeTab === "appearance" && (
        <form onSubmit={handleSaveBotSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Identity Card */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span>Agent Persona & Greetings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Agent Name</label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="e.g. Acme Support Assistant"
                      className="h-9 text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">Displayed in the chat widget header.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Initial Welcome Message</label>
                    <textarea
                      value={botGreeting}
                      onChange={(e) => setBotGreeting(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border bg-background p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      placeholder="Hello! Welcome to our support. How can I help you today?"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">The first message a visitor sees when opening your widget.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Suggested Quick Questions</label>
                    <div className="flex gap-2">
                      <Input
                        value={newPromptInput}
                        onChange={(e) => setNewPromptInput(e.target.value)}
                        placeholder="e.g. What are your pricing plans?"
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSuggestedMessage();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAddSuggestedMessage}
                        className="h-8 text-xs"
                      >
                        Add Prompt
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {suggestedMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-muted text-foreground text-[11px] flex items-center gap-1.5 border"
                        >
                          <span>{msg}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSuggestedMessage(idx)}
                            className="text-muted-foreground hover:text-foreground font-bold ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme & Brand Color */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>Brand Theme & Color Palette</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground">Widget Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={botColor}
                        onChange={(e) => setBotColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border cursor-pointer p-0.5 bg-background"
                      />
                      <Input
                        value={botColor}
                        onChange={(e) => setBotColor(e.target.value)}
                        className="h-9 w-32 font-mono text-xs uppercase"
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setBotColor(preset.hex)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] hover:border-foreground/40 transition-colors"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Chatbot Preview Panel */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Live Widget Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="border rounded-2xl overflow-hidden shadow-lg bg-card">
                    {/* Header */}
                    <div
                      className="p-3 text-white flex items-center gap-2.5"
                      style={{ backgroundColor: botColor }}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                        {botName ? botName[0] : "N"}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-bold text-xs truncate">{botName || "NzoAI Assistant"}</div>
                        <div className="text-[10px] text-white/80 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Online • {currentActiveModelObj?.displayName || "NzoAI"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="p-3.5 space-y-2.5 min-h-[160px] bg-muted/10 text-xs">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] shrink-0 font-bold"
                          style={{ backgroundColor: botColor }}
                        >
                          AI
                        </div>
                        <div className="bg-muted p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-foreground text-[11px] leading-relaxed">
                          {botGreeting || "Hello! How can I assist you today?"}
                        </div>
                      </div>

                      {/* Quick questions pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestedMessages.slice(0, 2).map((m, i) => (
                          <div
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full border bg-background text-muted-foreground truncate max-w-[200px]"
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={botSaving}
                    className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90 h-9 gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{botSaving ? "Saving Changes..." : "Save Chatbot Settings"}</span>
                  </Button>

                  {botSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Chatbot settings saved successfully!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================================
          TAB 3: WORKSPACE & TEAM
          ========================================================================= */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Quota Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Team Seats Quota</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {isSuper
                      ? `${membersList.length || 1} / Unlimited`
                      : memberQuota
                      ? `${memberQuota.current} / ${memberQuota.max}`
                      : "1 / 2"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isSuper ? "Exempt from seat limits" : `Allowed under ${planName} plan`}
                  </p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Chatbots Quota</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {isSuper ? "1 / Unlimited" : botQuota ? `${botQuota.current} / ${botQuota.max}` : "1 / 1"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isSuper ? "Exempt from bot limits" : `Allowed under ${planName} plan`}
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          </div>

          {/* Superadmin Dynamic Overrides for this Workspace */}
          {isSuper && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3 border-b border-amber-500/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Crown className="w-4 h-4" />
                  <span>Superadmin Master Overrides for this Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                {superadminActionMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{superadminActionMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Plan Tier Override */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground">Direct Plan Tier Assignment (No Payment Needed)</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedPlanTier}
                        onChange={(e) => setSelectedPlanTier(e.target.value)}
                        className="h-8 px-2 rounded-md border bg-background text-xs flex-1"
                      >
                        <option value="starter">Starter Plan (GH₵ 400 / mo)</option>
                        <option value="growth">Growth Plan (GH₵ 1,100 / mo)</option>
                        <option value="pro">Professional Plan (GH₵ 2,800 / mo)</option>
                        <option value="enterprise">Enterprise Plan (Unlimited)</option>
                      </select>
                      <Button
                        size="sm"
                        disabled={superadminActionLoading}
                        onClick={() => handleSuperadminOverride(selectedPlanTier)}
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Apply Tier
                      </Button>
                    </div>
                  </div>

                  {/* Add Credits */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground">Grant Bonus Credits</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={grantCreditsAmount}
                        onChange={(e) => setGrantCreditsAmount(Number(e.target.value))}
                        className="h-8 text-xs w-32"
                        step={1000}
                        min={500}
                      />
                      <Button
                        size="sm"
                        disabled={superadminActionLoading}
                        onClick={handleGrantCredits}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Add Credits</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Profile */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Organization Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <form onSubmit={handleSaveOrganization} className="space-y-4 max-w-xl">
                {orgError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">{orgError}</div>
                )}
                {orgSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Organization profile updated successfully!</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Organization Display Name</label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Workspace URL Slug</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-mono">nzoai.com/</span>
                    <Input
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-corp"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={orgSaving}
                  className="h-8 text-xs bg-[#800020] hover:bg-[#800020]/90 text-white gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{orgSaving ? "Saving..." : "Save Workspace Profile"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Team Members & Invitations */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Team Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5 text-xs">
              {/* Invite Form */}
              {canInvite ? (
                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-8 text-xs flex-1"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-8 px-2.5 rounded-md border bg-background text-xs"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="h-8 text-xs text-white bg-[#800020] hover:bg-[#800020]/90 shrink-0 gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Sending..." : "Invite Member"}</span>
                  </Button>
                </form>
              ) : (
                <p className="text-muted-foreground italic">
                  Only organization owners or admins can invite new teammates.
                </p>
              )}

              {inviteSent && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Invitation link generated and dispatched successfully!</span>
                </div>
              )}

              {/* Members Table */}
              <div className="border rounded-xl overflow-hidden divide-y">
                {membersList.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-muted/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {m.user?.name ? m.user.name[0] : "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{m.user?.name || "User"}</div>
                        <div className="text-[11px] text-muted-foreground">{m.user?.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize font-medium">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BILLING & SUBSCRIPTIONS
          ========================================================================= */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Subscription Plan & Payment Processing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/10">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                    Current Assigned Plan
                  </span>
                  <div className="text-xl font-black text-foreground mt-0.5">{planName}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed locally in Ghana Cedis (GH₵) via Paystack Mobile Money & Cards, or internationally in USD.
                  </p>
                </div>

                <Link to="/choose-plan">
                  <Button size="sm" className="bg-[#800020] hover:bg-[#800020]/90 text-white text-xs gap-1.5">
                    <span>Change Plan Tier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
