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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "billing">("workspace");

  const [limitsData, setLimitsData] = useState<any>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);

  const fetchLimitsAndMembers = async () => {
    try {
      const [limRes, memRes] = await Promise.all([
        fetch("/api/subscription/limits"),
        fetch("/api/invite-member"),
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
    } catch (err) {
      console.warn("Error fetching workspace settings data:", err);
    }
  };

  useEffect(() => {
    fetchLimitsAndMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
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

  const planName = limitsData?.plan?.name || "Starter";
  const userRole = limitsData?.role || "member";
  const isSuper = limitsData?.isSuperAdmin;
  const canInvite = isSuper || userRole === "owner" || userRole === "admin";
  const memberQuota = limitsData?.usage?.members;
  const botQuota = limitsData?.usage?.chatbots;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace & Settings</h1>
            {isSuper && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[11px]">
                <Crown className="w-3 h-3" />
                <span>Superadmin</span>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your organization, team members, invitations, and tier subscription.
          </p>
        </div>

        {/* Plan & Role Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1">
            Role: <span className="font-semibold capitalize ml-1">{userRole}</span>
          </Badge>
          <Badge className="bg-[#800020] text-white text-xs px-2.5 py-1">
            {planName} Tier
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "workspace" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Workspace & Team
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "billing" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Billing & Subscription
        </button>
      </div>

      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Tier Quota Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Team Seats Quota</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {memberQuota ? `${memberQuota.current} / ${memberQuota.max}` : "1 / 2"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Allowed under <span className="font-semibold text-primary">{planName}</span> plan
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
                    {botQuota ? `${botQuota.current} / ${botQuota.max}` : "1 / 1"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Allowed under <span className="font-semibold text-primary">{planName}</span> plan
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          </div>

          {/* Organization Details */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Organization Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Organization Name</label>
                  <Input defaultValue="NzoAI Workspace" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Workspace Slug</label>
                  <Input defaultValue="nzoai-workspace" className="h-8 text-xs" readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members & Invitations */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Team Members</span>
              </CardTitle>
              {memberQuota && (
                <span className="text-xs text-muted-foreground">
                  Seats: <strong className="text-foreground">{memberQuota.current}</strong> / {memberQuota.max}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Invite Form */}
              {canInvite ? (
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 text-xs">
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    className="h-8 text-xs flex-1"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <select
                    className="h-8 px-2 rounded-md border bg-background text-xs"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">Support Agent (Member)</option>
                    <option value="admin">Workspace Admin</option>
                  </select>
                  <Button type="submit" size="sm" className="h-8 text-xs shrink-0 gap-1.5" disabled={isSubmitting}>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Inviting..." : "Invite Teammate"}</span>
                  </Button>
                </form>
              ) : (
                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Only Workspace Owners and Admins can invite new teammates.</span>
                </div>
              )}

              {inviteSent && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Invitation dispatched successfully to {inviteEmail}!</span>
                </div>
              )}

              {inviteError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Members List */}
              <div className="divide-y border rounded-xl overflow-hidden mt-3 text-xs">
                {membersList.length > 0 ? (
                  membersList.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between bg-card hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold uppercase text-[11px]">
                          {(m.name || m.email || "U")[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{m.name || m.email}</p>
                          <p className="text-muted-foreground text-[11px]">{m.email}</p>
                        </div>
                      </div>
                      <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize text-[11px]">
                        {m.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        A
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Workspace Owner</p>
                        <p className="text-muted-foreground text-[11px]">Account Owner & Billing Contact</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>
                )}
              </div>

              {/* Pending Invitations */}
              {invitationsList.length > 0 && (
                <div className="pt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Pending Invitations</p>
                  <div className="divide-y border rounded-xl overflow-hidden text-xs">
                    {invitationsList.map((inv) => (
                      <div key={inv.id} className="p-3 flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{inv.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {inv.role}
                          </Badge>
                          <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Subscription Plan & Quotas</span>
              </CardTitle>
              <Badge className="bg-emerald-600 text-white">Active</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{planName} Tier</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {limitsData?.plan?.monthlyCredits?.toLocaleString() || "1,000"} monthly message credits ·{" "}
                    {limitsData?.plan?.allowWebsiteCrawl ? "Full recursive website crawl" : "Single-page scraper"} ·{" "}
                    {limitsData?.plan?.allowCustomBranding ? "White-label custom branding" : "Standard branding"}
                  </p>
                </div>
                <Link to="/choose-plan">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Upgrade Plan</span>
                  </Button>
                </Link>
              </div>

              {/* Quotas grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">Chatbots Limit</span>
                    <span className="font-semibold text-primary">
                      {botQuota ? `${botQuota.current} / ${botQuota.max}` : "1 / 1"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(100, ((botQuota?.current || 1) / (botQuota?.max || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">Team Seats Limit</span>
                    <span className="font-semibold text-primary">
                      {memberQuota ? `${memberQuota.current} / ${memberQuota.max}` : "1 / 2"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(100, ((memberQuota?.current || 1) / (memberQuota?.max || 2)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-foreground">Manage Billing on Polar</span>
                  <p className="text-[11px] text-muted-foreground">View invoices, update card details, or cancel subscription</p>
                </div>
                <a href="https://polar.sh" target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    <span>Polar Customer Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
