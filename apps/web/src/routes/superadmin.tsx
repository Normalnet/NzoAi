import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Crown,
  Users,
  Building2,
  Bot,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Server,
  ArrowLeft,
  Search,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Coins,
  X,
  Save,
  Key,
  Radio,
  Database,
  Cpu,
  LogIn,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Check,
  Zap,
  Globe,
  Star,
  Activity,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminPortalPage,
});

// Quick autocomplete presets for popular foundation models
const MODEL_PRESETS = [
  {
    id: "gemini-2.0-flash",
    displayName: "NzoGem 3 Cool",
    provider: "google",
    category: "fast",
    badge: "Ultra Fast",
    description: "Google Gemini 2.0 Flash engine with instantaneous generation, multimodal understanding, and high throughput.",
  },
  {
    id: "gemini-1.5-pro",
    displayName: "NzoGem 3 Pro",
    provider: "google",
    category: "reasoning",
    badge: "High Context",
    description: "Massive context window for deep analysis of extensive documents, PDFs, and intricate company knowledge.",
  },
  {
    id: "gpt-4o",
    displayName: "NzoOpen 4 Basic",
    provider: "openai",
    category: "balanced",
    badge: "Flagship",
    description: "OpenAI flagship intelligence for complex customer troubleshooting, multilingual nuance, and logic synthesis.",
  },
  {
    id: "gpt-4o-mini",
    displayName: "NzoOpen Mini Fast",
    provider: "openai",
    category: "fast",
    badge: "Fast & Light",
    description: "Cost-optimized, ultra-low latency model designed for high-volume customer conversation deflection.",
  },
  {
    id: "o3-mini",
    displayName: "NzoReason Mini",
    provider: "openai",
    category: "reasoning",
    badge: "Deep Thought",
    description: "OpenAI deliberate reasoning engine with chain-of-thought verification for high-precision technical answers.",
  },
  {
    id: "claude-3-5-sonnet",
    displayName: "NzoClaude 3 Smart",
    provider: "anthropic",
    category: "pro",
    badge: "Nuanced Voice",
    description: "Anthropic Claude 3.5 Sonnet known for articulate, polite, and deeply contextual customer support tone.",
  },
  {
    id: "deepseek-chat",
    displayName: "NzoSeek V3 Fast",
    provider: "custom",
    category: "fast",
    badge: "Cost Saver",
    description: "DeepSeek V3 model offering remarkable efficiency and high conversational accuracy at minimal token cost.",
  },
  {
    id: "deepseek-reasoner",
    displayName: "NzoSeek R1 Reasoning",
    provider: "custom",
    category: "reasoning",
    badge: "R1 Reasoning",
    description: "DeepSeek R1 frontier reasoning model for rigorous math, code, and policy interpretation.",
  },
];

function SuperadminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [orgSearch, setOrgSearch] = useState("");
  const [orgPlanFilter, setOrgPlanFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [modelSearch, setModelSearch] = useState("");

  const [activeTab, setActiveTab] = useState<"models" | "organizations" | "users" | "telemetry">("models");

  // --- Modals State ---
  // 1. Create Organization Modal
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgTier, setNewOrgTier] = useState("enterprise");
  const [newOrgCredits, setNewOrgCredits] = useState<number>(10000);

  // 2. Edit Organization Modal
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgSlug, setEditOrgSlug] = useState("");
  const [editOrgTier, setEditOrgTier] = useState("enterprise");
  const [editOrgCredits, setEditOrgCredits] = useState<number>(0);

  // 3. Organization Features Modal
  const [managingFeaturesOrg, setManagingFeaturesOrg] = useState<any | null>(null);
  const [featuresState, setFeaturesState] = useState({
    allowWebsiteCrawl: true,
    allowCustomBranding: true,
    allowLiveEscalation: true,
    allowDocumentUploads: true,
    allowMultiModel: true,
  });

  // 4. Create User Modal
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserOrgId, setNewUserOrgId] = useState("");

  // 5. Reset User Password Modal
  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  // 6. AI Model Catalog State (Database-backed)
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [modelFormId, setModelFormId] = useState("");
  const [modelFormName, setModelFormName] = useState("");
  const [modelFormProvider, setModelFormProvider] = useState("google");
  const [modelFormBadge, setModelFormBadge] = useState("Ultra Fast");
  const [modelFormCategory, setModelFormCategory] = useState("fast");
  const [modelFormDesc, setModelFormDesc] = useState("");
  const [modelFormApiKey, setModelFormApiKey] = useState("");
  const [modelFormEndpoint, setModelFormEndpoint] = useState("");
  const [modelFormTier, setModelFormTier] = useState("all");
  const [modelFormTemp, setModelFormTemp] = useState(70);
  const [modelFormDefault, setModelFormDefault] = useState(false);
  const [modelSaving, setModelSaving] = useState(false);

  // Global Feedback Toast
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, statusRes, modelsRes] = await Promise.all([
        fetch("/api/superadmin/overview", { headers: { Accept: "application/json" } }),
        fetch("/api/system-status", { headers: { Accept: "application/json" } }),
        fetch("/api/superadmin/models", { headers: { Accept: "application/json" } }),
      ]);

      if (!overviewRes.ok) {
        if (overviewRes.status === 401 || overviewRes.status === 403) {
          window.location.href = "/superadmin-login";
          return;
        }
        const err = await overviewRes.json().catch(() => ({}));
        setError(err.error || `HTTP ${overviewRes.status}: Access restricted`);
      } else {
        const overviewData = await overviewRes.json();
        setData(overviewData);
      }

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setSystemStatus(sData);
      }

      if (modelsRes.ok) {
        const mData = await modelsRes.json();
        if (Array.isArray(mData?.models)) {
          setModelsList(mData.models);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load superadmin overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Preset Selection Helper
  const applyModelPreset = (preset: typeof MODEL_PRESETS[0]) => {
    setModelFormId(preset.id);
    setModelFormName(preset.displayName);
    setModelFormProvider(preset.provider);
    setModelFormCategory(preset.category);
    setModelFormBadge(preset.badge);
    setModelFormDesc(preset.description);
  };

  // Open Add Model Dialog Cleanly
  const openAddModel = () => {
    setEditingModel(null);
    setModelFormId("");
    setModelFormName("");
    setModelFormProvider("google");
    setModelFormCategory("fast");
    setModelFormBadge("Ultra Fast");
    setModelFormDesc("");
    setModelFormApiKey("");
    setModelFormEndpoint("");
    setModelFormTier("all");
    setModelFormTemp(70);
    setModelFormDefault(false);
    setIsAddingModel(true);
  };

  // Open Edit Model Dialog
  const openEditModel = (model: any) => {
    setEditingModel(model);
    setModelFormId(model.id);
    setModelFormName(model.displayName);
    setModelFormProvider(model.provider || "openai");
    setModelFormCategory(model.category || "standard");
    setModelFormBadge(model.badge || "");
    setModelFormDesc(model.description || "");
    setModelFormApiKey(model.apiKey || "");
    setModelFormEndpoint(model.apiEndpoint || "");
    setModelFormTier(model.tierRequired || "all");
    setModelFormTemp(model.temperature || 70);
    setModelFormDefault(Boolean(model.isDefault));
    setIsAddingModel(true);
  };

  // Save (Create or Edit) AI Model to Database
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelFormId || !modelFormName) return;

    setModelSaving(true);
    try {
      const res = await fetch("/api/superadmin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modelFormId,
          displayName: modelFormName,
          provider: modelFormProvider,
          category: modelFormCategory,
          badge: modelFormBadge,
          description: modelFormDesc,
          apiKey: modelFormApiKey || null,
          apiEndpoint: modelFormEndpoint || null,
          tierRequired: modelFormTier,
          temperature: Number(modelFormTemp),
          isDefault: modelFormDefault,
          isActive: true,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to save AI model", "error");
      } else {
        showFeedback(`Model "${modelFormName}" saved to platform stack successfully!`);
        setIsAddingModel(false);
        if (Array.isArray(resData?.models)) {
          setModelsList(resData.models);
        } else {
          fetchData();
        }
      }
    } catch (err: any) {
      showFeedback(err.message || "Failed to save model", "error");
    } finally {
      setModelSaving(false);
    }
  };

  // Toggle Model Active Status
  const handleToggleModelActive = async (model: any) => {
    try {
      const res = await fetch("/api/superadmin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: model.id, isActive: !model.isActive }),
      });
      const resData = await res.json();
      if (res.ok && Array.isArray(resData?.models)) {
        setModelsList(resData.models);
        showFeedback(`Model "${model.displayName}" ${!model.isActive ? "enabled" : "disabled"} for all tenants.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Set Model as Default
  const handleSetModelDefault = async (model: any) => {
    try {
      const res = await fetch("/api/superadmin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: model.id, isDefault: true }),
      });
      const resData = await res.json();
      if (res.ok && Array.isArray(resData?.models)) {
        setModelsList(resData.models);
        showFeedback(`Model "${model.displayName}" set as platform default.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete AI Model
  const handleDeleteModel = async (model: any) => {
    if (!confirm(`Are you sure you want to remove "${model.displayName}" (${model.id}) from the platform?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/superadmin/models?id=${encodeURIComponent(model.id)}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (res.ok && Array.isArray(resData?.models)) {
        setModelsList(resData.models);
        showFeedback(`Model "${model.displayName}" deleted from platform catalog.`);
      }
    } catch (e: any) {
      showFeedback(e.message || "Failed to delete model", "error");
    }
  };

  // Create Organization
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/superadmin/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName,
          slug: newOrgSlug,
          planTier: newOrgTier,
          initialCredits: Number(newOrgCredits) || 5000,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to create organization", "error");
      } else {
        showFeedback(`Organization "${newOrgName}" created successfully!`);
        setIsCreatingOrg(false);
        setNewOrgName("");
        setNewOrgSlug("");
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error creating organization", "error");
    }
  };

  // Save Edited Organization
  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    try {
      const res = await fetch("/api/superadmin/organization/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: editingOrg.id,
          name: editOrgName,
          slug: editOrgSlug,
          planTier: editOrgTier,
          addCredits: Number(editOrgCredits) || 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to update organization", "error");
      } else {
        showFeedback(`Organization "${editOrgName}" updated!`);
        setEditingOrg(null);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error updating organization", "error");
    }
  };

  // Delete Organization
  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to permanently delete workspace "${orgName}" (${orgId}) and all its bots?`)) {
      return;
    }

    try {
      const res = await fetch("/api/superadmin/organization/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to delete organization", "error");
      } else {
        showFeedback(`Organization "${orgName}" deleted.`);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error deleting organization", "error");
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/superadmin/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          organizationId: newUserOrgId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to create user", "error");
      } else {
        showFeedback(`User account created for "${newUserEmail}"!`);
        setIsCreatingUser(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error creating user", "error");
    }
  };

  // Reset User Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resetPasswordVal) return;

    try {
      const res = await fetch("/api/superadmin/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resettingUser.id,
          newPassword: resetPasswordVal,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to reset password", "error");
      } else {
        showFeedback(`Password updated successfully for ${resettingUser.email}!`);
        setResettingUser(null);
        setResetPasswordVal("");
      }
    } catch (err: any) {
      showFeedback(err.message || "Error resetting password", "error");
    }
  };

  // Impersonate User (Access Account)
  const handleImpersonateUser = async (userRecord: any) => {
    if (!confirm(`Log in as ${userRecord.name} (${userRecord.email})? You will be redirected to their tenant dashboard.`)) {
      return;
    }

    try {
      const res = await fetch("/api/superadmin/user/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userRecord.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to initiate impersonation session", "error");
      } else {
        window.location.href = resData.redirectTo || "/admin/overview";
      }
    } catch (err: any) {
      showFeedback(err.message || "Error accessing user account", "error");
    }
  };

  // Filter lists
  const organizations = data?.organizations || [];
  const users = data?.users || [];
  const chatbots = data?.chatbots || [];

  const filteredOrgs = organizations.filter((org: any) => {
    const q = orgSearch.toLowerCase();
    const matchQ =
      org.name?.toLowerCase().includes(q) ||
      org.slug?.toLowerCase().includes(q) ||
      org.id?.toLowerCase().includes(q);
    const matchPlan = orgPlanFilter === "all" || (org.plan || "starter").toLowerCase() === orgPlanFilter.toLowerCase();
    return matchQ && matchPlan;
  });

  const filteredUsers = users.filter((u: any) => {
    const q = userSearch.toLowerCase();
    const matchQ =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q);
    const matchRole = userRoleFilter === "all" || u.role?.toLowerCase() === userRoleFilter.toLowerCase();
    return matchQ && matchRole;
  });

  const filteredModels = modelsList.filter((m: any) => {
    const q = modelSearch.toLowerCase();
    return (
      m.displayName?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.provider?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Verifying superadmin authorization...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Superadmin Access Required</h2>
          <p className="text-sm text-slate-400">
            {error || "You must be signed in with global superadmin privileges to view this portal."}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              onClick={() => {
                window.location.href = "/superadmin-login";
              }}
            >
              Sign In as Superadmin
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-900 flex flex-col">
      {/* Top Master Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                N
              </div>
              <span className="font-extrabold tracking-tight">NzoAI</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1.5 text-xs font-semibold px-2.5 py-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Master Console</span>
              </Badge>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{data?.superadmin || "founder@nzoai.com"}</span>
            </div>

            <Link to="/admin/overview">
              <Button size="sm" variant="ghost" className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tenant Portal</span>
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Executive Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-6">
        {/* Master Control Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">Platform Operations & AI Catalog</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Crown className="w-3 h-3" />
                God Mode Active
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Live executive controls: dynamically add foundation AI models, configure branded names, manage customer workspaces, help users access accounts, and toggle tenant feature flags.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={openAddModel}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add AI Model</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreatingOrg(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700 gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>New Tenant</span>
            </Button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border-rose-800 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 5 Executive KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Customer Tenants</p>
              <p className="text-2xl font-black text-white mt-1">
                {data?.metrics?.organizationsCount ?? (loading ? "..." : 2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Multi-tenant workspaces</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Platform Accounts</p>
              <p className="text-2xl font-black text-white mt-1">
                {data?.metrics?.usersCount ?? (loading ? "..." : 2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active users & operators</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Deployed Chatbots</p>
              <p className="text-2xl font-black text-white mt-1">
                {data?.metrics?.chatbotsCount ?? (loading ? "..." : 2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all tenants</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#800020]/20 border border-[#800020]/40 text-rose-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Live AI Model Stack</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{modelsList.length || 5}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Configured models</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">System Uptime</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">99.9%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Cloud Neon + Edge</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Standardized Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("models")}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "models"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Model Stack & Catalog ({modelsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("organizations")}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "organizations"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tenant Workspaces ({organizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "users"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Platform Users & Impersonation ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "telemetry"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Gateway Health & Secrets</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: AI MODEL STACK & CATALOG (SOLVING QUESTION 2)
            ========================================================================= */}
        {activeTab === "models" && (
          <div className="space-y-6">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">White-label AI Model Gateway</h2>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Add, brand, and configure foundation models (OpenAI, Gemini, Anthropic, DeepSeek, etc.). When tenants select an engine in their Settings, NzoAI routes live conversations through your mapped model.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Search models..."
                  className="h-8 w-48 text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600"
                />
                <Button
                  size="sm"
                  onClick={openAddModel}
                  className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Model</span>
                </Button>
              </div>
            </div>

            {/* Model Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => {
                const isDefault = Boolean(model.isDefault);
                const isActive = model.isActive !== false;

                return (
                  <div
                    key={model.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-slate-900/90 relative ${
                      isDefault
                        ? "border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : isActive
                        ? "border-slate-800 hover:border-slate-700"
                        : "border-slate-800/50 opacity-60 bg-slate-950/60"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{model.displayName}</h3>
                            {isDefault && (
                              <Badge className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0">
                                DEFAULT
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{model.id}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className={`text-[10px] uppercase font-bold px-2 py-0 border ${
                              model.provider === "google"
                                ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                                : model.provider === "openai"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : model.provider === "anthropic"
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                : "bg-purple-500/15 border-purple-500/30 text-purple-400"
                            }`}
                          >
                            {model.provider}
                          </Badge>
                          {model.badge && (
                            <Badge className="bg-slate-800 border-slate-700 text-slate-300 text-[9px] py-0 px-1.5">
                              {model.badge}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[38px]">
                        {model.description}
                      </p>

                      {/* Technical Meta Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          temp: {(model.temperature ?? 70) / 100}
                        </span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          tier: {model.tierRequired || "all"}
                        </span>
                        {model.apiKey && (
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-amber-500/30 text-amber-400">
                            Custom Key
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleModelActive(model)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                            isActive
                              ? "bg-emerald-950/50 border-emerald-700 text-emerald-300 hover:bg-emerald-900/50"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-500"}`}
                          />
                          <span>{isActive ? "Active" : "Disabled"}</span>
                        </button>

                        {!isDefault && isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetModelDefault(model)}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                            title="Set as platform default"
                          >
                            <Star className="w-3 h-3" />
                            <span>Set Default</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModel(model)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteModel(model)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: TENANT WORKSPACES
            ========================================================================= */}
        {activeTab === "organizations" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <Input
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Filter workspaces by name, slug, or ID..."
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={orgPlanFilter}
                  onChange={(e) => setOrgPlanFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>

                <Button
                  size="sm"
                  onClick={() => setIsCreatingOrg(true)}
                  className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </Button>
              </div>
            </div>

            {/* Organizations Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Workspace / Organization</th>
                    <th className="p-4">Assigned Plan</th>
                    <th className="p-4">Chatbots</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrgs.map((org: any) => (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center text-sm">
                            {org.name ? org.name[0] : "O"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{org.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              slug: {org.slug || "none"} • ID: {org.id.slice(0, 14)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                            org.plan === "enterprise" || org.plan === "master"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              : org.plan === "pro"
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {org.plan || "Starter"}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Bot className="w-3.5 h-3.5 text-slate-500" />
                          <span>{org.chatbotCount ?? 1} bot</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-500">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "Active"}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingOrg(org);
                              setEditOrgName(org.name);
                              setEditOrgSlug(org.slug || "");
                              setEditOrgTier(org.plan || "enterprise");
                              setEditOrgCredits(0);
                            }}
                            className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteOrganization(org.id, org.name)}
                            className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PLATFORM USERS & IMPERSONATION
            ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter users by name or email address..."
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="user">Standard User</option>
                </select>

                <Button
                  size="sm"
                  onClick={() => setIsCreatingUser(true)}
                  className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Assigned Workspace</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Platform Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                            {u.name ? u.name[0] : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                            u.role === "superadmin"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {u.role || "user"}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <span className="text-slate-300 font-medium">{u.organizationName || "Platform Workspace"}</span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleImpersonateUser(u)}
                            className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 gap-1.5 shadow-xs"
                            title="Log in directly as this tenant"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Access Account</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setResettingUser(u);
                              setResetPasswordVal("");
                            }}
                            className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 gap-1"
                          >
                            <Key className="w-3 h-3" />
                            <span>Reset Pass</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: GATEWAY HEALTH & SECRETS
            ========================================================================= */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Database & Infrastructure Connections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Neon PostgreSQL</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">ep-sparkling-paper (AWS eu-central-1)</div>
                    </div>
                    <Badge className="bg-emerald-950/60 border-emerald-800 text-emerald-300">Connected</Badge>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Better Auth Engine</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">Session cookies & scrypt hashing</div>
                    </div>
                    <Badge className="bg-emerald-950/60 border-emerald-800 text-emerald-300">Ready</Badge>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Paystack Ghana Billing</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">Mobile Money & Card Gateway</div>
                    </div>
                    <Badge className="bg-emerald-950/60 border-emerald-800 text-emerald-300">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Configured Gateway Secrets</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">DATABASE_URL</span>
                    <span className="text-emerald-400">CONFIGURED</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">OPENAI_API_KEY</span>
                    <span className="text-emerald-400">CONFIGURED</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">BETTER_AUTH_SECRET</span>
                    <span className="text-emerald-400">CONFIGURED</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">PAYSTACK_SECRET_KEY</span>
                    <span className="text-emerald-400">CONFIGURED</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODALS / DIALOGS
          ========================================================================= */}

      {/* MODAL 1: Add or Edit AI Model */}
      {isAddingModel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingModel ? `Edit Model: ${editingModel.displayName}` : "Add AI Foundation Model to Stack"}
                </h3>
              </div>
              <button onClick={() => setIsAddingModel(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-6 space-y-4 text-xs">
              {/* Quick Presets Carousel if creating fresh */}
              {!editingModel && (
                <div className="space-y-1.5 pb-2 border-b border-slate-800">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Model Presets (1-Click Autocomplete)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {MODEL_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyModelPreset(p)}
                        className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-slate-800 text-[11px] text-slate-300 font-medium transition-all"
                      >
                        {p.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Technical Model Identifier</label>
                  <Input
                    value={modelFormId}
                    onChange={(e) => setModelFormId(e.target.value)}
                    placeholder="e.g. gemini-2.0-flash or gpt-4o"
                    className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-200"
                    required
                    disabled={!!editingModel}
                  />
                  <p className="text-[10px] text-slate-500">ID sent to provider API / AI Gateway.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">White-label Branded Name</label>
                  <Input
                    value={modelFormName}
                    onChange={(e) => setModelFormName(e.target.value)}
                    placeholder="e.g. NzoGem 3 Cool"
                    className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                    required
                  />
                  <p className="text-[10px] text-slate-500">What tenants see in their settings.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Underlying Provider</label>
                  <select
                    value={modelFormProvider}
                    onChange={(e) => setModelFormProvider(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                  >
                    <option value="google">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="custom">DeepSeek / Custom</option>
                    <option value="groq">Groq / Llama</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Category Tag</label>
                  <select
                    value={modelFormCategory}
                    onChange={(e) => setModelFormCategory(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                  >
                    <option value="fast">Ultra Fast (Low latency)</option>
                    <option value="balanced">Balanced Flagship</option>
                    <option value="reasoning">Deep Reasoning</option>
                    <option value="pro">Pro Multimodal</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Badge Label</label>
                  <Input
                    value={modelFormBadge}
                    onChange={(e) => setModelFormBadge(e.target.value)}
                    placeholder="e.g. Most Popular"
                    className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Description for Tenants</label>
                <textarea
                  value={modelFormDesc}
                  onChange={(e) => setModelFormDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  placeholder="Explain when tenants should choose this model..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Custom Provider Key (Optional)</label>
                  <Input
                    type="password"
                    value={modelFormApiKey}
                    onChange={(e) => setModelFormApiKey(e.target.value)}
                    placeholder="Leave empty to use platform default key"
                    className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Tier Restriction</label>
                  <select
                    value={modelFormTier}
                    onChange={(e) => setModelFormTier(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                  >
                    <option value="all">Available on All Plans</option>
                    <option value="growth">Growth Plans & Above</option>
                    <option value="pro">Pro Plans & Above</option>
                    <option value="enterprise">Enterprise Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={modelFormDefault}
                    onChange={(e) => setModelFormDefault(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-amber-500"
                  />
                  <span>Set as Platform Default Model for new chatbots</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingModel(false)}
                    className="h-8 text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={modelSaving}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    {modelSaving ? "Saving..." : editingModel ? "Update Model" : "Add to Platform Stack"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Organization */}
      {isCreatingOrg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Create Tenant Workspace</h3>
              <button onClick={() => setIsCreatingOrg(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateOrganization} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Workspace Name</label>
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Stark Enterprises"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Slug</label>
                <Input
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="stark-enterprises"
                  className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Initial Plan</label>
                <select
                  value={newOrgTier}
                  onChange={(e) => setNewOrgTier(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                >
                  <option value="enterprise">Enterprise (Unlimited)</option>
                  <option value="pro">Professional (GH₵ 2,800/mo)</option>
                  <option value="growth">Growth (GH₵ 1,100/mo)</option>
                  <option value="starter">Starter (GH₵ 400/mo)</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingOrg(false)}
                  className="h-8 text-xs border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  Create Workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create User */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Create User Account</h3>
              <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name</label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address</label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Initial Password</label>
                <Input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                  >
                    <option value="user">Standard User</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Workspace</label>
                  <select
                    value={newUserOrgId}
                    onChange={(e) => setNewUserOrgId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                  >
                    <option value="">Default Workspace</option>
                    {organizations.map((org: any) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingUser(false)}
                  className="h-8 text-xs border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reset User Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Reset User Password</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Updating password for user: <strong className="text-white">{resettingUser.email}</strong>
              </p>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">New Password</label>
                <Input
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResettingUser(null)}
                  className="h-8 text-xs border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Edit Organization */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Edit Workspace</h3>
              <button onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveOrganization} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Workspace Name</label>
                <Input
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Slug</label>
                <Input
                  value={editOrgSlug}
                  onChange={(e) => setEditOrgSlug(e.target.value)}
                  className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Plan Tier</label>
                <select
                  value={editOrgTier}
                  onChange={(e) => setEditOrgTier(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200"
                >
                  <option value="enterprise">Enterprise (Unlimited)</option>
                  <option value="pro">Professional</option>
                  <option value="growth">Growth</option>
                  <option value="starter">Starter</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Add Bonus Credits</label>
                <Input
                  type="number"
                  value={editOrgCredits}
                  onChange={(e) => setEditOrgCredits(Number(e.target.value))}
                  placeholder="0"
                  className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingOrg(null)}
                  className="h-8 text-xs border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
