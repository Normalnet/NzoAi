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
  ShieldAlert,
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

  // Organization settings state
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
    fetchLimitsAndMembers();
  }, []);

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    setOrgError("");
    setOrgSuccess(false);

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrgError(data.error || "Failed to save organization settings.");
      } else {
        setOrgSuccess(true);
        setTimeout(() => setOrgSuccess(false), 4000);
        fetchLimitsAndMembers();
      }
    } catch (err: any) {
      setOrgError(err.message || "Failed to update organization.");
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSuperadminOverride = async (tier: string, credits?: number) => {
    setSuperadminActionLoading(true);
    setSuperadminActionMsg("");

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: tier,
          grantCredits: credits || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuperadminActionMsg(
          credits
            ? `Granted +${credits.toLocaleString()} credits to workspace!`
            : `Workspace plan overridden to "${tier.toUpperCase()}" tier!`
        );
        fetchLimitsAndMembers();
        setTimeout(() => setSuperadminActionMsg(""), 4000);
      } else {
        setSuperadminActionMsg(data.error || "Superadmin action failed.");
      }
    } catch (err: any) {
      setSuperadminActionMsg(err.message || "Failed action");
    } finally {
      setSuperadminActionLoading(false);
    }
  };

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

  const isSuper = limitsData?.isSuperAdmin;
  const planName = isSuper ? "Platform Master" : limitsData?.plan?.name || "Starter";
  const userRole = isSuper ? "superadmin" : limitsData?.role || "member";
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
              <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 gap-1 text-[11px] font-semibold">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>NzoAI Superadmin</span>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your organization profile, team members, invitations, and system quotas.
          </p>
        </div>

        {/* Plan & Role Badge */}
        <div className="flex items-center gap-2">
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

      {/* Superadmin Platform Master Banner */}
      {isSuper && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">You are logged in as NzoAI Platform Superadmin</p>
              <p className="text-muted-foreground mt-0.5">
                You have master authority to edit any organization, override tiers, adjust credit quotas, or manage the entire platform.
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
          {/* Quota Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Team Seats Quota</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {isSuper ? `${membersList.length || 1} / Unlimited` : memberQuota ? `${memberQuota.current} / ${memberQuota.max}` : "1 / 2"}
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
                    <p className="text-[11px] text-muted-foreground">
                      Instantly upgrades or downgrades this organization's active tier in the database.
                    </p>
                  </div>

                  {/* Instant Credit Grant */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground">Grant Message Credits</label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1"
                        disabled={superadminActionLoading}
                        onClick={() => handleSuperadminOverride(selectedPlanTier, 1000)}
                      >
                        +1,000 Credits
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1"
                        disabled={superadminActionLoading}
                        onClick={() => handleSuperadminOverride(selectedPlanTier, 5000)}
                      >
                        +5,000 Credits
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1"
                        disabled={superadminActionLoading}
                        onClick={() => handleSuperadminOverride(selectedPlanTier, 25000)}
                      >
                        +25,000 Credits
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Adds message credits directly to this workspace's account balance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Details Form */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Organization Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {orgSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Organization settings saved successfully!</span>
                </div>
              )}

              {orgError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orgError}</span>
                </div>
              )}

              <form onSubmit={handleSaveOrganization} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Organization Name</label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Workspace Slug</label>
                    <Input
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="e.g. acme-corp"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={orgSaving}>
                    <Save className="w-3.5 h-3.5" />
                    <span>{orgSaving ? "Saving..." : "Save Organization"}</span>
                  </Button>
                </div>
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
              {memberQuota && (
                <span className="text-xs text-muted-foreground">
                  Seats: <strong className="text-foreground">{isSuper ? membersList.length || 1 : memberQuota.current}</strong> / {isSuper ? "Unlimited" : memberQuota.max}
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
                        P
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Platform Founder</p>
                        <p className="text-muted-foreground text-[11px]">Account Owner & Superadmin</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Superadmin</Badge>
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
          {isSuper ? (
            /* Superadmin Master Billing View */
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3 border-b border-amber-500/20 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Crown className="w-4 h-4" />
                  <span>Platform Master Account</span>
                </CardTitle>
                <Badge className="bg-amber-600 text-white">Billing Exempt</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">NzoAI Platform Master (God Mode)</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    As the platform owner, your superadmin account is exempt from payment gateways, monthly subscription fees, and quotas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border bg-background space-y-1">
                    <span className="text-xs text-muted-foreground">Chatbots Limit</span>
                    <p className="text-lg font-bold text-amber-600">Unlimited</p>
                    <p className="text-[11px] text-muted-foreground">Create as many bots as required</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-background space-y-1">
                    <span className="text-xs text-muted-foreground">Team Seats</span>
                    <p className="text-lg font-bold text-amber-600">Unlimited</p>
                    <p className="text-[11px] text-muted-foreground">Invite unlimited platform operators</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-background space-y-1">
                    <span className="text-xs text-muted-foreground">Monthly Message Credits</span>
                    <p className="text-lg font-bold text-amber-600">Unlimited</p>
                    <p className="text-[11px] text-muted-foreground">No credit deductions on master calls</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Platform Subscriptions Directory</span>
                    <p className="text-[11px] text-muted-foreground">
                      Inspect all customer subscriptions, active revenue, and payment health across organizations.
                    </p>
                  </div>
                  <Link to="/superadmin">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
                      <span>Open Platform Backoffice</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Tenant Billing View */
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
                    <span className="text-xs font-medium text-foreground">Manage Subscription & Plans</span>
                    <p className="text-[11px] text-muted-foreground">
                      Upgrade tier, view invoices, or update Mobile Money & Card details via Paystack
                    </p>
                  </div>
                  <a href="/choose-plan">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5">
                      <span>Manage Plans</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
