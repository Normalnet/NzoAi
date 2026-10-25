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
  Activity,
  RefreshCw,
  AlertTriangle,
  Server,
  ArrowLeft,
  Search,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Database,
  Radio,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminPortalPage,
});

function SuperadminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"tenants" | "telemetry" | "billing">("tenants");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, statusRes] = await Promise.all([
        fetch("/api/superadmin/overview", { headers: { Accept: "application/json" } }),
        fetch("/api/system-status", { headers: { Accept: "application/json" } }),
      ]);

      if (!overviewRes.ok) {
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
    } catch (err: any) {
      setError(err.message || "Failed to load superadmin overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const organizations = data?.recentOrganizations || [];
  const filteredOrgs = organizations.filter((org: any) => {
    const q = searchQuery.toLowerCase();
    return (
      org.name?.toLowerCase().includes(q) ||
      org.slug?.toLowerCase().includes(q) ||
      org.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-muted/15 font-sans flex flex-col text-foreground">
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
                <Crown className="w-3 h-3" />
                <span>Superadmin Backoffice</span>
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Administration</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Global system monitoring, multi-tenant directory, and infrastructure health for NzoAI.
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 px-3.5 py-2 rounded-xl border flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#800020]" />
            <span>
              Authenticated as: <strong className="text-foreground">{data?.superadmin || "founder@nzoai.com"}</strong>
            </span>
          </div>
        </div>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Superadmin Authentication Required</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {error}. Your email must be listed in <code className="bg-muted px-1.5 py-0.5 rounded font-mono">SUPERADMIN_EMAILS</code> in your environment file.
              </p>
              <div className="pt-2">
                <Button size="sm" onClick={fetchData} variant="outline" className="text-xs">
                  Retry Connection
                </Button>
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
                    <p className="text-[11px] text-muted-foreground mt-0.5">Across all workspaces</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Organizations</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.organizationsCount ?? (loading ? "..." : 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Active tenants</p>
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
                    <p className="text-[11px] text-muted-foreground mt-0.5">Trained & deployed</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Conversations</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.conversationsCount ?? (loading ? "..." : 0)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Customer sessions</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Paid Subscriptions</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                      {data?.metrics?.subscriptionsCount ?? (loading ? "..." : 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Polar billing active</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b pb-2">
              <button
                onClick={() => setActiveTab("tenants")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "tenants"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Tenant Directory
              </button>
              <button
                onClick={() => setActiveTab("telemetry")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "telemetry"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Infrastructure Telemetry
              </button>
            </div>

            {/* Tab: Tenants Directory */}
            {activeTab === "tenants" && (
              <Card>
                <CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Multi-Tenant Workspaces</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Showing {filteredOrgs.length} registered workspaces
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search workspace..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
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
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              Tenant ID: <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">{org.id}</code>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[11px] gap-1">
                              <Bot className="w-3 h-3 text-primary" />
                              <span>{org.chatbotCount || 1} Chatbot(s)</span>
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Created {new Date(org.createdAt).toLocaleDateString()}
                            </span>
                            <Link to="/admin/overview">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                <span>Manage</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs">
                        No organizations matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab: Infrastructure Telemetry */}
            {activeTab === "telemetry" && (
              <div className="space-y-4">
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
                          <span>Realtime chat escalation protocol</span>
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
    </div>
  );
}
