import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Star, UserPlus, AlertCircle, RefreshCw, Mail, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export const Route = createFileRoute("/admin/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "lead" | "feedback" | "issue">("all");

  const loadActivities = () => {
    fetch("/api/activity")
      .then((r) => r.ok && r.json())
      .then((d) => d && setActivities(d.activities || []));
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filtered = activities.filter((act) => (filter === "all" ? true : act.type === filter));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Stream</h1>
          <p className="text-sm text-muted-foreground">
            Review captured customer leads, satisfaction feedback, and reported issues in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg border text-xs">
            {["all", "lead", "feedback", "issue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  filter === f ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={loadActivities} className="h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Captured Events ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">No activity records recorded yet.</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.type === "lead" && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "feedback" && (
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Star className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "issue" && (
                      <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {item.name || item.title || item.subject || "Customer Feedback"}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {item.type}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {item.message || item.description || "No description provided"}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                      {item.contact && <span>Contact: {item.contact}</span>}
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </span>
                      )}
                      {item.rating && (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {item.rating}/5
                        </span>
                      )}
                      {item.location?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location.city}, {item.location.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
