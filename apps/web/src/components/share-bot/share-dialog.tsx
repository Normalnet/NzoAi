import React, { useState } from "react";
import { Copy, Check, Code, Globe, MessageSquare, X } from "lucide-react";
import { Button } from "../ui/button";

interface ShareDialogProps {
  embedToken: string;
  chatbotName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ embedToken, chatbotName, isOpen, onClose }: ShareDialogProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bubble" | "iframe" | "link">("bubble");

  if (!isOpen) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nzoai.com";
  const shareLink = `${baseUrl}/talk/${embedToken}`;

  const bubbleCode = `<!-- NzoAI Chatbot Widget -->
<script>
  window.NzoAIWidget = {
    config: {
      embedToken: "${embedToken}",
      baseUrl: "${baseUrl}",
      mode: "bubble",
      position: "bottom-right",
      bubbleSize: "medium"
    }
  };
</script>
<script src="${baseUrl}/embed.js" async></script>`;

  const iframeCode = `<iframe
  src="${baseUrl}/talk/${embedToken}"
  width="100%"
  height="700px"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
  allow="microphone; camera">
</iframe>`;

  const handleCopy = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Share & Embed "{chatbotName}"</h3>
            <p className="text-xs text-muted-foreground">Add this chatbot to your site or share a direct link</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tab selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab("bubble")}
              className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "bubble" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Bubble</span>
            </button>
            <button
              onClick={() => setActiveTab("iframe")}
              className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "iframe" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Inline Iframe</span>
            </button>
            <button
              onClick={() => setActiveTab("link")}
              className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "link" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Hosted Link</span>
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "bubble" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Paste this script into your site's HTML right before the closing &lt;/body&gt; tag:
              </p>
              <pre className="bg-muted p-3.5 rounded-xl text-xs font-mono overflow-x-auto text-foreground max-h-48 border">
                {bubbleCode}
              </pre>
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => handleCopy(bubbleCode, "bubble")}
              >
                {copiedTab === "bubble" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "bubble" ? "Copied to clipboard!" : "Copy Embed Code"}</span>
              </Button>
            </div>
          )}

          {activeTab === "iframe" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Embed this chatbot directly inside any container on your webpage:
              </p>
              <pre className="bg-muted p-3.5 rounded-xl text-xs font-mono overflow-x-auto text-foreground max-h-48 border">
                {iframeCode}
              </pre>
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => handleCopy(iframeCode, "iframe")}
              >
                {copiedTab === "iframe" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "iframe" ? "Copied to clipboard!" : "Copy Iframe Code"}</span>
              </Button>
            </div>
          )}

          {activeTab === "link" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Share this dedicated hosted link with clients or use it in marketing campaigns:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-muted px-3 py-2 text-xs rounded-lg border font-mono text-foreground"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs shrink-0"
                  onClick={() => handleCopy(shareLink, "link")}
                >
                  {copiedTab === "link" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === "link" ? "Copied" : "Copy Link"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
