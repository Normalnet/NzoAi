import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { signIn, signOut } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Lock, Mail, ShieldCheck, Crown, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/(auth)/superadmin-login")({
  component: SuperadminLoginPage,
});

function SuperadminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillSuperAdmin = () => {
    setEmail("founder@nzoai.com");
    setPassword("admin123456");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid superadmin credentials");
        setLoading(false);
        return;
      }

      // Verify that user possesses superadmin role
      const limitsRes = await fetch("/api/subscription/limits");
      if (limitsRes.ok) {
        const limitsData = await limitsRes.json();
        if (!limitsData.isSuperAdmin) {
          // Sign out immediately if not a superadmin
          await signOut();
          setError("Access Denied: This portal is restricted to NzoAI Platform Operators. Please use the client portal at /login.");
          setLoading(false);
          return;
        }
      }

      // Successful verification: Navigate to Superadmin Backoffice
      window.location.href = "/superadmin";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <CardHeader className="text-center pb-2 pt-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <Crown className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>NzoAI Master Console</span>
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Restricted administrative gateway for NzoAI platform founders and operations.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Quick Auto-fill banner for dev */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Founder Master Key
              </span>
              <button
                type="button"
                onClick={fillSuperAdmin}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Auto-fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div>Email: <strong className="text-slate-200">founder@nzoai.com</strong></div>
              <div>Pass: <strong className="text-slate-200">admin123456</strong></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-slate-300">Superadmin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <Input
                  type="email"
                  placeholder="founder@nzoai.com"
                  className="pl-9 h-9 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-slate-300">Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-9 h-9 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-xs font-bold gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
              disabled={loading}
            >
              <span>{loading ? "Authenticating Master Session..." : "Access Platform Console"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Not an operator? Return to Client Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
