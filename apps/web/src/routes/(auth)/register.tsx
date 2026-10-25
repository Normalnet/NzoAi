import React, { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { signUp } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Lock, Mail, User, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to create account");
      } else {
        router.navigate({ to: "/onboarding" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20 font-sans">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mx-auto mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#800020] text-white flex items-center justify-center font-bold">
              N
            </div>
            <span>NzoAI</span>
          </Link>
          <CardTitle className="text-xl">Create your NzoAI Account</CardTitle>
          <p className="text-xs text-muted-foreground">Start building AI customer support agents in minutes</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-foreground">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  placeholder="Alex Doe"
                  className="pl-9 h-9 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-foreground">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  type="email"
                  placeholder="alex@company.com"
                  className="pl-9 h-9 text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  className="pl-9 h-9 text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90 h-9"
              disabled={loading}
            >
              <span>{loading ? "Creating workspace..." : "Continue to Setup"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
