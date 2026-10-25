import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/superadmin")({
  component: SuperadminPage,
});

function SuperadminPage() {
  const [data, setData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, statusRes] = await Promise.all([
        fetch("/api/superadmin/overview"),
        fetch("/api/system-status"),
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Superadmin</h1>
            <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 gap-1 px-2 py-0.5 text-xs">
              <Crown className="w-3.5 h-3.5" />
              <span>Platform Backoffice</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            System-wide operational metrics, multi-tenant directory, and infrastructure telemetry.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="text-xs gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Superadmin Access Required</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {error}. To access this backoffice, your account email must be added to{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">SUPERADMIN_EMAILS</code> in{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">.env</code> or assigned the{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">superadmin</code> role in the database.
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
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Registered Users</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data?.metrics?.usersCount ?? (loading ? "..." : 0)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Organizations</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data?.metrics?.organizationsCount ?? (loading ? "..." : 0)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Chatbots</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data?.metrics?.chatbotsCount ?? (loading ? "..." : 0)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conversations</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data?.metrics?.conversationsCount ?? (loading ? "..." : 0)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Paid Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data?.metrics?.subscriptionsCount ?? (loading ? "..." : 0)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Infrastructure Health Status */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span>Services & Realtime Telemetry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="font-medium text-foreground">Web Application (apps/web)</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="font-medium text-foreground">WebSocket Server (apps/server)</span>
                  <Badge variant={systemStatus?.services?.server?.reachable ? "success" : "secondary"}>
                    {systemStatus?.services?.server?.reachable ? "Connected" : "Standby"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <span className="font-medium text-foreground">Vector Search Index (HNSW)</span>
                  <Badge variant="success">Active (768-dim)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tenant Organizations */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Registered Workspaces (Tenants)</span>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Total: <strong>{data?.recentOrganizations?.length || 0}</strong> listed
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-xs">
                {data?.recentOrganizations && data.recentOrganizations.length > 0 ? (
                  data.recentOrganizations.map((org: any) => (
                    <div
                      key={org.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{org.name}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">({org.slug})</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          Tenant ID: <code className="font-mono">{org.id}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[11px]">
                          {org.chatbotCount || 0} Chatbot(s)
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Created {new Date(org.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    {loading ? "Loading organizations..." : "No organizations registered yet."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
