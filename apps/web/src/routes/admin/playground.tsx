import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatPreview } from "../../components/chat/chat-preview";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Check, Save, RotateCcw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export const Route = createFileRoute("/admin/playground")({
  component: PlaygroundPage,
});

function PlaygroundPage() {
  const [chatbot, setChatbot] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    primaryColor: "#800020",
    personality: "support",
    theme: "light",
    initialMessage: "",
    suggestedMessages: [] as string[],
    hidePoweredBy: false,
    allowedDomains: [] as string[],
  });
  const [suggestedInput, setSuggestedInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Playground chat state
  const [chatId, setChatId] = useState(uuidv4());
  const [messages, setMessages] = useState<any[]>([]);
  const [chatStatus, setChatStatus] = useState("ready"); // 'ready' | 'submitted' | 'streaming'

  const loadBot = () => {
    fetch("/api/my-chatbot")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.chatbot) {
          setChatbot(data.chatbot);
          setFormData({
            name: data.chatbot.name || "",
            primaryColor: data.chatbot.primaryColor || "#800020",
            personality: data.chatbot.personality || "support",
            theme: data.chatbot.theme || "light",
            initialMessage: data.chatbot.initialMessage || "",
            suggestedMessages: data.chatbot.suggestedMessages || [],
            hidePoweredBy: Boolean(data.chatbot.hidePoweredBy),
            allowedDomains: data.chatbot.allowedDomains || [],
          });
        }
      });
  };

  useEffect(() => {
    loadBot();
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg = { id: uuidv4(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatStatus("submitted");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      setChatStatus("streaming");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantMsgId = uuidv4();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // AI SDK UI data stream parsing (format: 0:"text")
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const textPart = JSON.parse(line.slice(2));
                assistantText += textPart;
              } catch (e) {}
            }
          }

          setMessages([
            ...newMessages,
            { id: assistantMsgId, role: "assistant", content: assistantText },
          ]);
        }
      }
      setChatStatus("ready");
    } catch (err) {
      console.error(err);
      setChatStatus("ready");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/my-chatbot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
        loadBot();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChat = () => {
    setChatId(uuidv4());
    setMessages([]);
    setChatStatus("ready");
  };

  const addSuggestedQuestion = () => {
    if (!suggestedInput.trim()) return;
    setFormData({
      ...formData,
      suggestedMessages: [...formData.suggestedMessages, suggestedInput.trim()],
    });
    setSuggestedInput("");
  };

  const removeSuggestedQuestion = (index: number) => {
    setFormData({
      ...formData,
      suggestedMessages: formData.suggestedMessages.filter((_, i) => i !== index),
    });
  };

  const addDomain = () => {
    if (!domainInput.trim()) return;
    setFormData({
      ...formData,
      allowedDomains: [...formData.allowedDomains, domainInput.trim().toLowerCase()],
    });
    setDomainInput("");
  };

  const removeDomain = (index: number) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Playground & Customization</h1>
        <p className="text-sm text-muted-foreground">
          Test your agent's responses in real time and customize its persona, appearance, and rules.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left: Interactive Chat Preview */}
        <div className="lg:col-span-7 h-[650px] flex flex-col">
          {chatbot ? (
            <ChatPreview
              chatbot={{
                ...chatbot,
                name: formData.name || chatbot.name,
                primaryColor: formData.primaryColor,
                initialMessage: formData.initialMessage,
                suggestedMessages: formData.suggestedMessages,
                hidePoweredBy: formData.hidePoweredBy,
              }}
              messages={messages}
              status={chatStatus}
              onSendMessage={handleSendMessage}
              onReset={handleResetChat}
            />
          ) : (
            <div className="h-full flex items-center justify-center border rounded-2xl bg-muted/20">
              <span className="text-sm text-muted-foreground">Loading chatbot preview...</span>
            </div>
          )}
        </div>

        {/* Right: Settings Form */}
        <div className="lg:col-span-5 h-[650px] overflow-y-auto">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Bot Appearance & Behavior</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {/* Bot Name */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Chatbot Name</label>
                  <Input
                    className="h-8 text-xs"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Primary Color Picker */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-md border cursor-pointer p-0.5"
                    />
                    <Input
                      className="h-8 text-xs font-mono"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                </div>

                {/* Personality selector */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Personality / Role</label>
                  <select
                    className="w-full h-8 px-2 rounded-md border bg-background text-xs"
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  >
                    <option value="support">Customer Support Agent</option>
                    <option value="sales">Sales & Lead Specialist</option>
                    <option value="lead">Lead Capture Assistant</option>
                    <option value="custom">Custom Brand Representative</option>
                  </select>
                </div>

                {/* Initial Greeting */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Initial Greeting</label>
                  <Textarea
                    className="min-h-[60px] text-xs resize-none"
                    value={formData.initialMessage}
                    onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                  />
                </div>

                {/* Suggested Questions */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Suggested Questions</label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Add suggested question..."
                      className="h-8 text-xs"
                      value={suggestedInput}
                      onChange={(e) => setSuggestedInput(e.target.value)}
                    />
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={addSuggestedQuestion}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.suggestedMessages.map((sug, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border text-[11px]">
                        <span>{sug}</span>
                        <button type="button" onClick={() => removeSuggestedQuestion(i)} className="text-muted-foreground hover:text-foreground">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allowed Domains */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Allowed Embedding Domains</label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="e.g. example.com"
                      className="h-8 text-xs"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                    />
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={addDomain}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.allowedDomains.map((dom, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border text-[11px]">
                        <span>{dom}</span>
                        <button type="button" onClick={() => removeDomain(i)} className="text-muted-foreground hover:text-foreground">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Branding toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-foreground">Hide "Powered by NzoAI"</span>
                  <input
                    type="checkbox"
                    checked={formData.hidePoweredBy}
                    onChange={(e) => setFormData({ ...formData, hidePoweredBy: e.target.checked })}
                    className="w-4 h-4 rounded-sm border"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full gap-2 text-xs text-white"
                    style={{ backgroundColor: formData.primaryColor }}
                    disabled={isSaving}
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? "Saved successfully!" : isSaving ? "Saving..." : "Save Customizations"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
