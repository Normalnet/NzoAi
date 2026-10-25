import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Users,
  BookOpen,
  Zap,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  const [chatbot, setChatbot] = useState<any>(null);
  const [sourcesCount, setSourcesCount] = useState<any>({ total: 0 });
  const [activityCount, setActivityCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const loadData = () => {
    fetch("/api/my-chatbot")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setChatbot(d.chatbot));

    fetch("/api/sources/count")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setSourcesCount(d));

    fetch("/api/activity")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setActivityCount(d.activities?.length || 0));

    fetch("/api/chat/history?limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setChatCount(d.chats?.length || 0));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      await fetch("/api/train-agent", { method: "POST" });
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your AI agent's performance, training status, and customer interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/playground">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Play className="w-3.5 h-3.5" />
              <span>Open Playground</span>
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: chatbot?.primaryColor || "#800020" }}
            onClick={handleTrain}
            disabled={isTraining}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTraining ? "animate-spin" : ""}`} />
            <span>{isTraining ? "Training Agent..." : "Train Agent"}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Conversations</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total customer chats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Indexed Sources</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sourcesCount.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Docs, Text, FAQs, Pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Captured Activities</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads, Feedback, Reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Training State</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={chatbot?.trainingStatus === "completed" ? "success" : "secondary"}>
                {chatbot?.trainingStatus || "idle"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {chatbot?.lastTrainedAt ? `Last trained: ${new Date(chatbot.lastTrainedAt).toLocaleDateString()}` : "Not trained yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Bot Details Card */}
      {chatbot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Chatbot: {chatbot.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Personality / Mode</span>
                <p className="font-semibold capitalize">{chatbot.personality}</p>
              </div>
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Embed Token</span>
                <p className="font-mono font-semibold text-xs">{chatbot.embedToken}</p>
              </div>
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Public Embedding</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {chatbot.isEmbeddingEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link to="/admin/knowledge-base">
                <Button variant="outline" size="sm" className="text-xs">
                  Manage Knowledge Base
                </Button>
              </Link>
              <Link to="/admin/playground">
                <Button size="sm" className="text-xs text-white" style={{ backgroundColor: chatbot.primaryColor || "#800020" }}>
                  Customize Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
