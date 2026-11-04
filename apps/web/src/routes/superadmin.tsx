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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { AIModelDefinition } from "../lib/ai/models";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminPortalPage,
});

function SuperadminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [orgSearch, setOrgSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [botSearch, setBotSearch] = useState("");

  const [activeTab, setActiveTab] = useState<"organizations" | "users" | "chatbots" | "models" | "telemetry">(
    "organizations"
  );

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

  // 3. Organization Features & Capabilities Modal
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

  // 6. AI Model Catalog State
  const [modelsList, setModelsList] = useState<AIModelDefinition[]>([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState<any>("google");
  const [newModelBadge, setNewModelBadge] = useState("Fast");
  const [newModelDesc, setNewModelDesc] = useState("");

  // Global Feedback banner
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

  // --- ACTIONS ---

  // 1. Create Organization
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

  // 2. Save Edited Organization
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
          grantCredits: Number(editOrgCredits) || 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to update organization", "error");
      } else {
        showFeedback(`Organization "${editOrgName}" updated successfully.`);
        setEditingOrg(null);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error updating organization", "error");
    }
  };

  // 3. Save Organization Features & Capabilities
  const handleSaveFeatures = async () => {
    if (!managingFeaturesOrg) return;
    try {
      const res = await fetch("/api/superadmin/organization/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: managingFeaturesOrg.id,
          features: featuresState,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Failed to save features", "error");
      } else {
        showFeedback(`Capabilities updated for "${managingFeaturesOrg.name}".`);
        setManagingFeaturesOrg(null);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error updating features", "error");
    }
  };

  // 4. Delete Organization
  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Permanently delete workspace "${orgName}" and all associated data?`)) return;
    try {
      const res = await fetch("/api/superadmin/organization/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const resData = await res.json();
      if (!res.ok) showFeedback(resData.error || "Failed to delete", "error");
      else {
        showFeedback(`Workspace "${orgName}" deleted.`);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error deleting organization", "error");
    }
  };

  // 5. Create User
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
        showFeedback(`User ${newUserEmail} created successfully.`);
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

  // 6. Impersonate / Access User Account
  const handleImpersonateUser = async (userRecord: any) => {
    if (!window.confirm(`Log in and access account as "${userRecord.email}"?`)) return;
    try {
      const res = await fetch("/api/superadmin/user/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userRecord.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showFeedback(resData.error || "Impersonation failed", "error");
      } else {
        showFeedback(`Logging in as ${userRecord.email}...`);
        window.location.href = resData.redirectUrl || "/admin/overview";
      }
    } catch (err: any) {
      showFeedback(err.message || "Error accessing account", "error");
    }
  };

  // 7. Reset User Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
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
        showFeedback(`Password updated for ${resettingUser.email}.`);
        setResettingUser(null);
        setResetPasswordVal("");
      }
    } catch (err: any) {
      showFeedback(err.message || "Error resetting password", "error");
    }
  };

  // 8. Toggle User Superadmin Role
  const handleToggleUserRole = async (userRecord: any) => {
    const newRole = userRecord.role === "superadmin" ? "user" : "superadmin";
    if (!window.confirm(`Change role of "${userRecord.email}" to "${newRole}"?`)) return;
    try {
      const res = await fetch("/api/superadmin/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userRecord.id, role: newRole }),
      });
      const resData = await res.json();
      if (!res.ok) showFeedback(resData.error || "Failed to update role", "error");
      else {
        showFeedback(`User ${userRecord.email} is now a ${newRole}.`);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error updating role", "error");
    }
  };

  // 9. Delete User
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user account "${email}"? This action is permanent.`)) return;
    try {
      const res = await fetch("/api/superadmin/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const resData = await res.json();
      if (!res.ok) showFeedback(resData.error || "Failed to delete user", "error");
      else {
        showFeedback(`User account ${email} deleted.`);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error deleting user", "error");
    }
  };

  // 10. Delete Chatbot
  const handleDeleteChatbot = async (botId: string, botName: string) => {
    if (!window.confirm(`Permanently delete chatbot "${botName}" (${botId}) and all vector memory?`)) return;
    try {
      const res = await fetch("/api/superadmin/chatbot/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId: botId }),
      });
      const resData = await res.json();
      if (!res.ok) showFeedback(resData.error || "Failed to delete chatbot", "error");
      else {
        showFeedback(`Chatbot "${botName}" deleted.`);
        fetchData();
      }
    } catch (err: any) {
      showFeedback(err.message || "Error deleting chatbot", "error");
    }
  };

  // 11. AI Model Catalog Actions
  const handleSaveModels = async (updated: AIModelDefinition[]) => {
    try {
      const res = await fetch("/api/superadmin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: updated }),
      });
      const resData = await res.json();
      if (!res.ok) showFeedback(resData.error || "Failed to save models", "error");
      else {
        showFeedback("AI Model Catalog saved.");
        setModelsList(resData.models || updated);
      }
    } catch (err: any) {
      showFeedback(err.message || "Error saving models", "error");
    }
  };

  const handleToggleModelActive = (modelId: string) => {
    const updated = modelsList.map((m) => (m.id === modelId ? { ...m, isActive: !m.isActive } : m));
    setModelsList(updated);
    handleSaveModels(updated);
  };

  const handleSetDefaultModel = (modelId: string) => {
    const updated = modelsList.map((m) => ({ ...m, isDefault: m.id === modelId }));
    setModelsList(updated);
    handleSaveModels(updated);
  };

  const handleUpdateModelDisplayName = (modelId: string, newName: string) => {
    const updated = modelsList.map((m) => (m.id === modelId ? { ...m, displayName: newName } : m));
    setModelsList(updated);
  };

  const handleAddNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelId || !newModelName) return;
    const newEntry: AIModelDefinition = {
      id: newModelId.trim(),
      displayName: newModelName.trim(),
      provider: newModelProvider,
      description: newModelDesc.trim() || `${newModelName} AI Model`,
      badge: newModelBadge.trim() || undefined,
      isActive: true,
    };
    const updated = [...modelsList, newEntry];
    setModelsList(updated);
    handleSaveModels(updated);
    setIsAddingModel(false);
    setNewModelId("");
    setNewModelName("");
    setNewModelDesc("");
  };

  // Filter lists
  const organizations = data?.organizations || [];
  const users = data?.users || [];
  const chatbots = data?.chatbots || [];

  const filteredOrgs = organizations.filter((org: any) => {
    const q = orgSearch.toLowerCase();
    return org.name?.toLowerCase().includes(q) || org.slug?.toLowerCase().includes(q) || org.id?.toLowerCase().includes(q);
  });

  const filteredUsers = users.filter((u: any) => {
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q);
  });

  const filteredBots = chatbots.filter((b: any) => {
    const q = botSearch.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.organizationName?.toLowerCase().includes(q) ||
      b.embedToken?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-muted/15 font-sans flex flex-col text-foreground selection:bg-amber-500 selection:text-slate-900">
      {/* Top Superadmin Navbar */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-[#800020] text-white flex items-center justify-center font-black">
                N
              </div>
              <span>NzoAI</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 gap-1 text-[11px] font-semibold px-2 py-0.5">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Master Console</span>
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/overview">
              <Button size="sm" variant="ghost" className="text-xs gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tenant Dashboard</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-6">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Administration & Dynamic Ops</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Crown className="w-3 h-3" />
                God Mode Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Directly create users, help clients access accounts, toggle features, manage organizations, and configure white-label AI models dynamically.
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 px-3.5 py-2 rounded-xl border flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#800020]" />
            <span>
              Superadmin: <strong className="text-foreground">{data?.superadmin || "founder@nzoai.com"}</strong>
            </span>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Superadmin Authentication Required</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {error}. Please sign in with your platform superadmin credentials.
              </p>
              <div className="pt-2">
                <Link to="/superadmin-login">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                    Sign in to Master Console
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Registered Users</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.usersCount ?? (loading ? "..." : 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Total accounts</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Workspaces</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.organizationsCount ?? (loading ? "..." : 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Multi-tenant orgs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">AI Chatbots</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.chatbotsCount ?? (loading ? "..." : 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Across all tenants</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">AI Models Active</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {modelsList.filter((m) => m.isActive).length || 5}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">White-labeled catalog</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Platform Health</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">100%</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">All services online</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("organizations")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "organizations"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Organizations ({organizations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "users"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Users & Accounts ({users.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("chatbots")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "chatbots"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>All Chatbots ({chatbots.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("models")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "models"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-amber-500" />
                <span>White-label AI Models ({modelsList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("telemetry")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "telemetry"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Infrastructure & Secrets</span>
              </button>
            </div>

            {/* TAB 1: ORGANIZATIONS & MULTI-TENANTS */}
            {activeTab === "organizations" && (
              <Card>
                <CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Workspace Multi-Tenants</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Showing {filteredOrgs.length} registered organizations
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search workspace..."
                        value={orgSearch}
                        onChange={(e) => setOrgSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingOrg(true)}
                      className="h-8 text-xs gap-1.5 bg-[#800020] hover:bg-[#600018] text-white shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y text-xs">
                    {filteredOrgs.length > 0 ? (
                      filteredOrgs.map((org: any) => (
                        <div
                          key={org.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{org.name}</span>
                              <Badge variant="secondary" className="font-mono text-[10px]">
                                {org.slug}
                              </Badge>
                              <Badge
                                className={`text-[10px] capitalize ${
                                  org.planTier === "master"
                                    ? "bg-amber-600 text-white"
                                    : org.planTier === "pro"
                                    ? "bg-purple-600 text-white"
                                    : org.planTier === "growth"
                                    ? "bg-blue-600 text-white"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {org.planTier} Tier
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              ID: <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">{org.id}</code> · Created{" "}
                              {new Date(org.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Adopt / Manage Features */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setManagingFeaturesOrg(org);
                                try {
                                  if (org.metadata) {
                                    const parsed = typeof org.metadata === "string" ? JSON.parse(org.metadata) : org.metadata;
                                    if (parsed.features) setFeaturesState(parsed.features);
                                  }
                                } catch (e) {}
                              }}
                              className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Features</span>
                            </Button>

                            {/* Edit / Override Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingOrg(org);
                                setEditOrgName(org.name || "");
                                setEditOrgSlug(org.slug || "");
                                setEditOrgTier(org.planTier || "enterprise");
                                setEditOrgCredits(0);
                              }}
                              className="h-7 text-xs gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOrganization(org.id, org.name)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs">
                        No organizations matching "{orgSearch}".
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: PLATFORM USERS */}
            {activeTab === "users" && (
              <Card>
                <CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Platform Users & Access Accounts</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Showing {filteredUsers.length} platform user accounts
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search users by email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingUser(true)}
                      className="h-8 text-xs gap-1.5 bg-[#800020] hover:bg-[#600018] text-white shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New User</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y text-xs">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u: any) => (
                        <div
                          key={u.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{u.name || "Unnamed"}</span>
                              <Badge
                                variant={u.role === "superadmin" ? "default" : "secondary"}
                                className={`text-[10px] capitalize ${
                                  u.role === "superadmin" ? "bg-amber-600 text-white" : ""
                                }`}
                              >
                                {u.role === "superadmin" && <Crown className="w-2.5 h-2.5 mr-1" />}
                                {u.role}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              {u.email} · ID: <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">{u.id}</code>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Impersonate / Access Account */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpersonateUser(u)}
                              className="h-7 text-xs gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Access Account</span>
                            </Button>

                            {/* Reset Password */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResettingUser(u);
                                setResetPasswordVal("");
                              }}
                              className="h-7 text-xs gap-1"
                            >
                              <Key className="w-3 h-3" />
                              <span>Reset Pass</span>
                            </Button>

                            {/* Toggle Role */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserRole(u)}
                              className="h-7 text-xs"
                            >
                              {u.role === "superadmin" ? "Demote" : "Make Superadmin"}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs">
                        No users matching "{userSearch}".
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: ALL CHATBOTS ACROSS PLATFORM */}
            {activeTab === "chatbots" && (
              <Card>
                <CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span>All Platform Chatbots</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Showing {filteredBots.length} active chatbots across all tenants
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search chatbots..."
                      value={botSearch}
                      onChange={(e) => setBotSearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y text-xs">
                    {filteredBots.length > 0 ? (
                      filteredBots.map((bot: any) => (
                        <div
                          key={bot.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: bot.primaryColor || "#800020" }}
                              />
                              <span className="font-bold text-foreground text-sm">{bot.name}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {bot.organizationName}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                Status: {bot.trainingStatus || "idle"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              Embed Token: <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">{bot.embedToken}</code> · Sources: {bot.sourcesCount || 0}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to="/admin/playground">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                <span>Playground</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteChatbot(bot.id, bot.name)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs">
                        No chatbots matching "{botSearch}".
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: WHITE-LABELED AI MODEL CATALOG */}
            {activeTab === "models" && (
              <Card>
                <CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-500" />
                      <span>White-label AI Models Catalog</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure branded names for underlying models (OpenAI, Gemini, Anthropic) so users select friendly tag names.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddingModel(true)}
                    className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Model</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="divide-y border rounded-xl overflow-hidden bg-card">
                    {modelsList.map((model) => (
                      <div
                        key={model.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{model.displayName}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {model.id}
                            </Badge>
                            <Badge variant="secondary" className="uppercase text-[9px]">
                              {model.provider}
                            </Badge>
                            {model.badge && (
                              <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 text-[10px]">
                                {model.badge}
                              </Badge>
                            )}
                            {model.isDefault && (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                Default Model
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-[11px]">{model.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Rename Tag Dialog */}
                          <div className="flex items-center gap-1">
                            <Input
                              value={model.displayName}
                              onChange={(e) => handleUpdateModelDisplayName(model.id, e.target.value)}
                              onBlur={() => handleSaveModels(modelsList)}
                              className="h-7 text-xs w-40"
                              placeholder="Branded Name"
                            />
                          </div>

                          {!model.isDefault && model.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefaultModel(model.id)}
                              className="h-7 text-[11px]"
                            >
                              Set Default
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant={model.isActive ? "default" : "secondary"}
                            onClick={() => handleToggleModelActive(model.id)}
                            className={`h-7 text-[11px] ${
                              model.isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                            }`}
                          >
                            {model.isActive ? "Enabled" : "Disabled"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 5: INFRASTRUCTURE & MASTER PLATFORM SETTINGS */}
            {activeTab === "telemetry" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="p-5 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      <span>Platform Secrets & Service Credentials Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Neon PostgreSQL</span>
                          <Badge variant={data?.platformSettings?.databaseUrlConfigured ? "success" : "destructive"}>
                            {data?.platformSettings?.databaseUrlConfigured ? "Connected" : "Missing"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">DATABASE_URL pooler & unpooled</p>
                      </div>

                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Paystack Ghana</span>
                          <Badge variant={data?.platformSettings?.paystackConfigured ? "success" : "secondary"}>
                            {data?.platformSettings?.paystackConfigured ? "Live Key Set" : "Test Fallback"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">PAYSTACK_SECRET_KEY</p>
                      </div>

                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">OpenAI Models</span>
                          <Badge variant={data?.platformSettings?.openaiConfigured ? "success" : "destructive"}>
                            {data?.platformSettings?.openaiConfigured ? "Active" : "Missing Key"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">OPENAI_API_KEY (GPT-4o & Embeddings)</p>
                      </div>

                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Firecrawl Webhook</span>
                          <Badge variant={data?.platformSettings?.firecrawlConfigured ? "success" : "secondary"}>
                            {data?.platformSettings?.firecrawlConfigured ? "Configured" : "Standby"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">FIRECRAWL_API_KEY</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-5 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-primary" />
                      <span>Cluster Infrastructure & Service Bindings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Web Service</span>
                          <Badge variant="success">Healthy</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">apps/web · Port 3001</p>
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Routing / and /api/* handlers</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">WebSocket Service</span>
                          <Badge variant={systemStatus?.services?.server?.reachable ? "success" : "secondary"}>
                            {systemStatus?.services?.server?.reachable ? "Connected" : "Standby"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">apps/server · Port 3000</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Radio className="w-3 h-3 text-primary" />
                          <span>Realtime chat takeover protocol</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Vector Search Engine</span>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">PostgreSQL pgvector</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Database className="w-3 h-3 text-primary" />
                          <span>HNSW index · 768 dimensions</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: Create Organization */}
      {isCreatingOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Create New Workspace</h3>
              </div>
              <button onClick={() => setIsCreatingOrg(false)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Organization / Client Name</label>
                <Input
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  placeholder="e.g. Apex Digital Corp"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Workspace Slug</label>
                <Input
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="e.g. apex-digital"
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Initial Subscription Tier</label>
                <select
                  value={newOrgTier}
                  onChange={(e) => setNewOrgTier(e.target.value)}
                  className="h-8 w-full px-2 rounded-md border bg-background text-xs"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="growth">Growth Plan</option>
                  <option value="pro">Professional Plan</option>
                  <option value="enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Initial Bonus Credits</label>
                <Input
                  type="number"
                  value={newOrgCredits}
                  onChange={(e) => setNewOrgCredits(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingOrg(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5 bg-[#800020] hover:bg-[#600018] text-white">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Organization */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Edit Workspace & Tier Override</h3>
              </div>
              <button onClick={() => setEditingOrg(null)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrganization} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Organization Name</label>
                <Input value={editOrgName} onChange={(e) => setEditOrgName(e.target.value)} className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Workspace Slug</label>
                <Input value={editOrgSlug} onChange={(e) => setEditOrgSlug(e.target.value)} className="h-8 text-xs font-mono" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Assigned Subscription Tier</label>
                <select
                  value={editOrgTier}
                  onChange={(e) => setEditOrgTier(e.target.value)}
                  className="h-8 w-full px-2 rounded-md border bg-background text-xs"
                >
                  <option value="starter">Starter Plan (1 Bot, 2 Seats, 1k Credits)</option>
                  <option value="growth">Growth Plan (3 Bots, 5 Seats, 5k Credits)</option>
                  <option value="pro">Professional Plan (5 Bots, 10 Seats, 25k Credits)</option>
                  <option value="enterprise">Enterprise / Master (Unlimited)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Grant Extra Message Credits</label>
                <Input
                  type="number"
                  value={editOrgCredits}
                  onChange={(e) => setEditOrgCredits(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="h-8 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingOrg(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5 bg-[#800020] hover:bg-[#600018] text-white">
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Workspace</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Manage Organization Capabilities / Features */}
      {managingFeaturesOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Adopt Capabilities for "{managingFeaturesOrg.name}"</h3>
              </div>
              <button onClick={() => setManagingFeaturesOrg(null)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-muted-foreground">
                Toggle advanced platform capabilities on or off for this specific organization dynamically.
              </p>

              <div className="space-y-3 divide-y">
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">Recursive Web Crawler</span>
                    <span className="text-[11px] text-muted-foreground">Allow full website domain spidering via Firecrawl</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeaturesState((s) => ({ ...s, allowWebsiteCrawl: !s.allowWebsiteCrawl }))}
                  >
                    {featuresState.allowWebsiteCrawl ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">White-label Custom Branding</span>
                    <span className="text-[11px] text-muted-foreground">Remove "Powered by NzoAI" badge on embeds</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeaturesState((s) => ({ ...s, allowCustomBranding: !s.allowCustomBranding }))}
                  >
                    {featuresState.allowCustomBranding ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">Realtime Human Escalation</span>
                    <span className="text-[11px] text-muted-foreground">WebSocket live human agent takeover</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeaturesState((s) => ({ ...s, allowLiveEscalation: !s.allowLiveEscalation }))}
                  >
                    {featuresState.allowLiveEscalation ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">Document & PDF Knowledge Extraction</span>
                    <span className="text-[11px] text-muted-foreground">Upload and vectorize PDFs, DOCX, and TXT files</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeaturesState((s) => ({ ...s, allowDocumentUploads: !s.allowDocumentUploads }))}
                  >
                    {featuresState.allowDocumentUploads ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">Multi-Model AI Selection</span>
                    <span className="text-[11px] text-muted-foreground">Allow selecting custom models (Gemini, Claude, GPT)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeaturesState((s) => ({ ...s, allowMultiModel: !s.allowMultiModel }))}
                  >
                    {featuresState.allowMultiModel ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setManagingFeaturesOrg(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSaveFeatures} className="h-8 text-xs bg-primary text-primary-foreground">
                  Apply Capabilities
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create User */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Create User Account</h3>
              </div>
              <button onClick={() => setIsCreatingUser(false)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Full Name</label>
                <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. John Doe" className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="e.g. john@company.com" className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Initial Password</label>
                <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="••••••••••••" className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Platform Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="h-8 w-full px-2 rounded-md border bg-background text-xs">
                  <option value="user">Standard User / Client</option>
                  <option value="superadmin">Platform Superadmin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Assign to Workspace (Optional)</label>
                <select value={newUserOrgId} onChange={(e) => setNewUserOrgId(e.target.value)} className="h-8 w-full px-2 rounded-md border bg-background text-xs">
                  <option value="">None / Standalone Account</option>
                  {organizations.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingUser(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5 bg-[#800020] hover:bg-[#600018] text-white">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Reset Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Reset Password for {resettingUser.email}</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">New Temporary Password</label>
                <Input
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="h-8 text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">The user will be able to log in with this password immediately.</p>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setResettingUser(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-primary text-primary-foreground">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Add Custom AI Model */}
      {isAddingModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Add Custom AI Model</h3>
              </div>
              <button onClick={() => setIsAddingModel(false)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewModel} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Underlying Model Identifier</label>
                <Input
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash or gpt-4.5"
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Technical model string sent to AI Gateway / Provider.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">White-label Branded Name</label>
                <Input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g. NzoGem 3 Cool"
                  className="h-8 text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">The friendly brand tag displayed to users in the UI.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Provider</label>
                <select
                  value={newModelProvider}
                  onChange={(e) => setNewModelProvider(e.target.value)}
                  className="h-8 w-full px-2 rounded-md border bg-background text-xs"
                >
                  <option value="google">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="meta">Meta Llama</option>
                  <option value="custom">Custom Provider</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tag Badge Label</label>
                <Input
                  value={newModelBadge}
                  onChange={(e) => setNewModelBadge(e.target.value)}
                  placeholder="e.g. Ultra Fast, Reasoning, Pro"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description</label>
                <Input
                  value={newModelDesc}
                  onChange={(e) => setNewModelDesc(e.target.value)}
                  placeholder="Short description of model capabilities"
                  className="h-8 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingModel(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                  Add to Catalog
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
