import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { authClient } from "../../lib/auth-client";
import { Users, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/invite/$id")({
  component: InviteAcceptancePage,
});

function InviteAcceptancePage() {
  const { id: inviteId } = Route.useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch current session
    authClient
      .getSession()
      .then((sess) => {
        if (sess?.data?.user) {
          setCurrentUser(sess.data.user);
        }
      })
      .catch(() => {});

    // 2. Fetch invitation details
    fetch(`/api/accept-invitation?id=${inviteId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load invitation.");
        } else {
          setInviteData(data.invitation);
        }
      })
      .catch((err) => {
        setError(err.message || "Network error loading invitation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [inviteId]);

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      router.navigate({ to: "/admin/overview" });
    } catch (err: any) {
      setError(err.message || "Failed to join organization.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 font-sans text-xs text-muted-foreground">
        Loading workspace invitation...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mx-auto mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#800020] text-white flex items-center justify-center font-bold">
              N
            </div>
            <span>NzoAI</span>
          </Link>
          <CardTitle className="text-xl">Workspace Team Invitation</CardTitle>
          <p className="text-xs text-muted-foreground">Collaborate on customer support in real time</p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-xs font-semibold text-destructive">{error}</p>
              <Link to="/login">
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            inviteData && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border bg-muted/30 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{inviteData.organizationName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">has invited you to join their team</p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                      Role: {inviteData.role}
                    </Badge>
                  </div>
                </div>

                {currentUser ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-lg border bg-card text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">Signed in as:</span>
                      <span className="font-semibold text-foreground">{currentUser.email}</span>
                    </div>

                    <Button
                      className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90 h-9"
                      onClick={handleAccept}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>{submitting ? "Joining Workspace..." : "Accept Invitation & Open Dashboard"}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Please sign in or create an account with <strong>{inviteData.email}</strong> to accept this invitation.
                    </p>
                    <Link to="/login" className="block">
                      <Button className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90 h-9">
                        <span>Sign In to Accept</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                    <Link to="/register" className="block">
                      <Button variant="outline" className="w-full text-xs h-9">
                        Create New Account
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
