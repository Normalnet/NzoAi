import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart2, Globe, Monitor, Smartphone, Users, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/visitor-analytics")
      .then((r) => r.ok && r.json())
      .then((d) => d && setEvents(d.events || []));
  }, []);

  const totalVisitors = new Set(events.map((e) => e.visitorId)).size;
  const desktopCount = events.filter((e) => e.device === "Desktop").length;
  const mobileCount = events.filter((e) => e.device === "Mobile").length;

  // Country counts
  const countryMap: Record<string, number> = {};
  for (const ev of events) {
    const c = ev.country || "Unknown";
    countryMap[c] = (countryMap[c] || 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Visitor Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Gain insights into widget impressions, unique visitors, geography, and engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Unique Visitors</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked visitor sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Events</CardTitle>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Impressions and interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Devices</CardTitle>
            <Monitor className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Desktop: {desktopCount}</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Mobile: {mobileCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Locations */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>Top Countries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {topCountries.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No location events logged yet.</div>
            ) : (
              topCountries.map(([country, count]) => (
                <div key={country} className="p-3.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{country}</span>
                  <span className="text-muted-foreground">{count} visits</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Events List */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Recent Activity Stream</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0 max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No recent events logged.</div>
            ) : (
              events.slice(0, 10).map((ev) => (
                <div key={ev.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground capitalize">{ev.event.replace("_", " ")}</p>
                    <p className="text-[11px] text-muted-foreground">{ev.city || "Accra"}, {ev.country || "GH"}</p>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
