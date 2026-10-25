import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Zap, Plus, Trash2, Calendar, Link as LinkIcon, UserPlus, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/actions")({
  component: ActionsPage,
});

function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [chatbot, setChatbot] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New action form
  const [formData, setFormData] = useState({
    toolName: "collect_leads",
    name: "",
    description: "",
    showInQuickMenu: true,
    url: "",
  });

  const loadActions = () => {
    fetch("/api/my-chatbot")
      .then((r) => r.ok && r.json())
      .then((d) => d && setChatbot(d.chatbot));

    fetch("/api/agent-actions")
      .then((r) => r.ok && r.json())
      .then((d) => d && setActions(d.actions || []));
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    try {
      await fetch("/api/agent-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: formData.toolName,
          name: formData.name,
          description: formData.description,
          showInQuickMenu: formData.showInQuickMenu,
          actionProperties: { url: formData.url },
        }),
      });
      setIsModalOpen(false);
      setFormData({
        toolName: "collect_leads",
        name: "",
        description: "",
        showInQuickMenu: true,
        url: "",
      });
      loadActions();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAction = async (id: string) => {
    try {
      await fetch(`/api/agent-actions?id=${id}`, { method: "DELETE" });
      loadActions();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAction = async (actionItem: any) => {
    try {
      await fetch("/api/agent-actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionItem.id, isActive: !actionItem.isActive }),
      });
      loadActions();
    } catch (err) {
      console.error(err);
    }
  };

  const primaryColor = chatbot?.primaryColor || "#800020";

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Actions & Tools</h1>
          <p className="text-sm text-muted-foreground">
            Configure dynamic capabilities for your bot: lead capture forms, scheduling links, and custom CTA buttons.
          </p>
        </div>

        <Button
          size="sm"
          className="gap-2 text-xs text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Action</span>
        </Button>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No custom actions yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Create an action like a lead capture prompt or custom appointment booking button.
            </p>
            <Button
              size="sm"
              className="mt-4 text-xs text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Action</span>
            </Button>
          </div>
        ) : (
          actions.map((act) => (
            <Card key={act.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={act.isActive ? "default" : "secondary"}>
                    {act.isActive ? "Active" : "Disabled"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteAction(act.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <CardTitle className="text-base mt-2">{act.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground line-clamp-3">{act.description}</p>
                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{act.toolName}</span>
                  <button
                    onClick={() => toggleAction(act)}
                    className="text-primary hover:underline font-medium"
                  >
                    {act.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-foreground">Create New Agent Action</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Action Type</label>
                <select
                  className="w-full h-9 px-3 rounded-md border bg-background text-xs"
                  value={formData.toolName}
                  onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
                >
                  <option value="collect_leads">Lead Capture Form (collect_leads)</option>
                  <option value="custom_button">Custom CTA Button (custom_button)</option>
                  <option value="cal_booking">Appointment Booking (cal_booking)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Action Name / Button Label</label>
                <Input
                  placeholder="e.g. Talk to Sales, Book a Consultation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">User Intent Description</label>
                <Textarea
                  placeholder="Explain when the model should invoke this tool (e.g. When visitor asks for pricing, sales consultation, or demo)"
                  className="min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {formData.toolName !== "collect_leads" && (
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Target URL / Booking Link</label>
                  <Input
                    placeholder="https://cal.com/example or https://mysite.com/pricing"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showInQuickMenu"
                  checked={formData.showInQuickMenu}
                  onChange={(e) => setFormData({ ...formData, showInQuickMenu: e.target.checked })}
                  className="w-4 h-4 rounded-sm border"
                />
                <label htmlFor="showInQuickMenu" className="text-muted-foreground">
                  Show as quick action button in chat widget
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-white" style={{ backgroundColor: primaryColor }}>
                  Save Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
